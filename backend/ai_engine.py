import os
import json
import logging
from dotenv import load_dotenv
import requests

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_engine")

load_dotenv()

def _read_api_keys(primary_env, fallback_env):
    keys = []
    primary = os.getenv(primary_env)
    if primary:
        keys.append(primary.strip())
    fallback = os.getenv(fallback_env, "")
    for key in [k.strip() for k in fallback.split(",") if k.strip()]:
        if key not in keys:
            keys.append(key)
    return keys

GEMINI_API_KEYS = _read_api_keys("GEMINI_API_KEY", "GEMINI_API_KEYS")
OPENAI_API_KEYS = _read_api_keys("OPENAI_API_KEY", "OPENAI_API_KEYS")
AI_KEYS_AVAILABLE = bool(GEMINI_API_KEYS or OPENAI_API_KEYS)

api_key = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else None
if GEMINI_API_KEYS and OPENAI_API_KEYS:
    logger.info("Gemini + OpenAI keys configured — using Gemini primary, with OpenAI fallback.")
elif GEMINI_API_KEYS:
    if len(GEMINI_API_KEYS) > 1:
        logger.info(f"Gemini API keys configured — primary key plus {len(GEMINI_API_KEYS)-1} fallback(s).")
    else:
        logger.info("Gemini API key found — using REST calls to Generative API.")
elif OPENAI_API_KEYS:
    if len(OPENAI_API_KEYS) > 1:
        logger.info(f"OpenAI API keys configured — primary key plus {len(OPENAI_API_KEYS)-1} fallback(s).")
    else:
        logger.info("OpenAI API key found — using ChatGPT/OpenAI REST calls.")
else:
    logger.warning("GEMINI_API_KEY not found in environment. Using high-fidelity local mock engine.")

class AIEngine:
    @staticmethod
    def _get_model():
        # Fall back gracefully to gemini-1.5-flash or similar
        return "gemini-1.5-flash"

    @classmethod
    def _request_gemini(cls, prompt):
        if not GEMINI_API_KEYS:
            raise ValueError("No Gemini key configured")

        model = cls._get_model()
        payload = {"prompt": {"text": prompt}, "response_format": {"type": "json"}}
        last_error = None

        for index, key in enumerate(GEMINI_API_KEYS):
            url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateText?key={key}"
            try:
                resp = requests.post(url, json=payload, timeout=30)
                if resp.status_code == 200:
                    try:
                        return resp.json()
                    except Exception:
                        return json.loads(resp.text)
                if resp.status_code in (401, 403, 429, 500, 502, 503, 504):
                    logger.warning(f"Gemini key {index} failed with status {resp.status_code}. Trying fallback key.")
                    last_error = Exception(f"Status {resp.status_code}: {resp.text}")
                    continue
                resp.raise_for_status()
                return resp.json()
            except Exception as exc:
                logger.warning(f"Gemini request failed for key {index}: {exc}")
                last_error = exc

        raise last_error or ValueError("No valid Gemini key available")

    @classmethod
    def _request_openai(cls, prompt):
        if not OPENAI_API_KEYS:
            raise ValueError("No OpenAI key configured")

        model = "gpt-3.5-turbo"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a JSON-only content generator. Return valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1500
        }
        last_error = None
        headers = {"Content-Type": "application/json"}

        for index, key in enumerate(OPENAI_API_KEYS):
            headers["Authorization"] = f"Bearer {key}"
            try:
                resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=30)
                if resp.status_code == 200:
                    body = resp.json()
                    content = body.get("choices", [{}])[0].get("message", {}).get("content", "")
                    try:
                        return json.loads(content)
                    except Exception:
                        return {"text": content}
                if resp.status_code in (401, 403, 429, 500, 502, 503, 504):
                    logger.warning(f"OpenAI key {index} failed with status {resp.status_code}. Trying fallback key.")
                    last_error = Exception(f"Status {resp.status_code}: {resp.text}")
                    continue
                resp.raise_for_status()
                return resp.json()
            except Exception as exc:
                logger.warning(f"OpenAI request failed for key {index}: {exc}")
                last_error = exc

        raise last_error or ValueError("No valid OpenAI key available")

    @classmethod
    def _request_ai(cls, prompt):
        if GEMINI_API_KEYS:
            try:
                return cls._request_gemini(prompt)
            except Exception as gemini_exc:
                if OPENAI_API_KEYS:
                    logger.info("Gemini failed; trying OpenAI fallback.")
                else:
                    raise gemini_exc
        if OPENAI_API_KEYS:
            return cls._request_openai(prompt)
        raise ValueError("No AI key configured")

    @classmethod
    def generate_adaptive_quiz(cls, domain, difficulty="beginner", history=None):
        """
        Generates a 5-question adaptive quiz in JSON format.
        Adjusts difficulty based on history or defaults to difficulty.
        """
        prompt = f"""
        Generate a highly technical 5-question adaptive assessment quiz for the domain "{domain}".
        The baseline target difficulty is "{difficulty}".
        
        The quiz must include:
        - 2 Multiple Choice Questions (MCQ) on core concepts.
        - 1 "Find the Bug / Code Completion" question (providing a short code snippet and asking for correct fixes).
        - 2 Technical scenario-based questions.
        
        Ensure each question tests a specific core concept within "{domain}".
        
        You must respond with ONLY a raw JSON object matching the following structure:
        {{
            "domain": "{domain}",
            "difficulty_level": "{difficulty}",
            "questions": [
                {{
                    "id": 1,
                    "question": "Question text or code scenario...",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                    "difficulty": "beginner",
                    "topic": "Specific subconcept name"
                }}
            ]
        }}
        """

        if not AI_KEYS_AVAILABLE:
            return cls._get_mock_quiz(domain, difficulty)

        try:
            return cls._request_ai(prompt)
        except Exception as e:
            logger.error(f"Error generating quiz via AI provider: {e}. Falling back to mock engine.")
            return cls._get_mock_quiz(domain, difficulty)

    @classmethod
    def analyze_quiz_results(cls, domain, questions, user_answers):
        """
        Analyzes the user's answers and identifies strong/weak topics and speed profile.
        """
        prompt = f"""
        Analyze the user's quiz performance in the domain "{domain}".
        
        Here are the quiz questions:
        {json.dumps(questions, indent=2)}
        
        Here are the user's selected answers:
        {json.dumps(user_answers, indent=2)}
        
        Evaluate the responses:
        1. Compare user answers with the correct answers.
        2. Identify weak concepts (where they answered incorrectly or showed low confidence).
        3. Identify strong concepts (where they answered correctly).
        4. Provide an overall score (0 to 100).
        5. Provide a confidence rating ("high", "medium", "low").
        6. Estimate their learning speed profile ("fast", "normal", "steady") based on their performance.
        
        You must respond with ONLY a raw JSON object matching this structure:
        {{
            "score": 80,
            "weak_concepts": ["concept1", "concept2"],
            "strong_concepts": ["concept3", "concept4"],
            "confidence_rating": "high",
            "learning_speed_estimate": "fast",
            "summary": "Short professional evaluation summary..."
        }}
        """

        if not AI_KEYS_AVAILABLE:
            return cls._get_mock_analysis(domain, questions, user_answers)

        try:
            return cls._request_ai(prompt)
        except Exception as e:
            logger.error(f"Error analyzing quiz via AI provider: {e}. Falling back to mock engine.")
            return cls._get_mock_analysis(domain, questions, user_answers)

    @classmethod
    def generate_personalized_roadmap(cls, domain, weak_concepts, strong_concepts, speed="normal"):
        """
        Generates a visually complete 3-phase roadmap graph, focusing heavily on bolstering weak concepts.
        """
        prompt = f"""
        Generate a comprehensive, personalized 3-phase learning roadmap for the domain "{domain}".
        The user wants to level up.
        
        Strengths: {json.dumps(strong_concepts)}
        Weaknesses / Areas of Improvement (PRIORITIZE THESE in Phase 2): {json.dumps(weak_concepts)}
        Learning Speed: "{speed}"
        
        Structure the roadmap into three distinct phases:
        - "Phase 1: Core Fundamentals" (Brief refresh of foundational elements)
        - "Phase 2: Deep Dive Focus" (Direct target on weak concepts with extensive detail)
        - "Phase 3: Applied Architecture" (Mini-projects and practical applications)
        
        Include 5 to 7 total nodes in the roadmap graph. Connect them in a logical progression.
        Ensure node layout coordinates (x, y) are provided. Space them out nicely on a virtual grid:
        - X coordinates between 100 and 900.
        - Y coordinates between 100 and 500.
        
        For each node, include curated high-quality resources (videos, official docs, tutorials) and 1 practical coding task.
        
        You must respond with ONLY a raw JSON object matching this structure:
        {{
            "domain": "{domain}",
            "nodes": [
                {{
                    "id": "node-1",
                    "title": "Topic Name",
                    "description": "Topic details...",
                    "estimated_hours": 6,
                    "phase": "Phase 1: Core Fundamentals",
                    "status": "unlocked",
                    "resources": [
                        {{
                            "type": "video",
                            "title": "Crash Course video tutorial",
                            "url": "https://www.youtube.com/results?search_query=..."
                        }},
                        {{
                            "type": "docs",
                            "title": "Official MDN Documentation",
                            "url": "https://developer.mozilla.org/"
                        }}
                    ],
                    "practice_tasks": ["Create a static site...", "Solve bug..."],
                    "mini_project": {{
                        "title": "Project Title",
                        "description": "Project specifications..."
                    }},
                    "x": 150,
                    "y": 200
                }}
            ],
            "connections": [
                {{
                    "from": "node-1",
                    "to": "node-2"
                }}
            ]
        }}
        """

        if not AI_KEYS_AVAILABLE:
            return cls._get_mock_roadmap(domain, weak_concepts, strong_concepts)

        try:
            return cls._request_ai(prompt)
        except Exception as e:
            logger.error(f"Error generating roadmap via AI provider: {e}. Falling back to mock engine.")
            return cls._get_mock_roadmap(domain, weak_concepts, strong_concepts)

    @classmethod
    def generate_ai_mentor_reply(cls, chat_history, current_message, active_topic=None):
        """
        Generates conversational support as a highly skilled tech mentor.
        """
        system_instructions = """
        You are "Quantum AI Mentor", a premium, friendly, highly analytical developer mentor built inside the SkillValut X Operating System.
        Your tone is supportive, technical, and extremely knowledgeable (like an elite Senior Staff Engineer explaining complex concepts in clear terms).
        If the user asks code-related questions, ALWAYS provide brief, clean code blocks in your markdown response.
        Do NOT write full applications, focus on elegant, highly optimized snippets.
        Use clean, rich markdown styling. Ensure to speak in developer terms (e.g. referencing anti-gravity UI widgets or workspace nodes when applicable).
        Do NOT include any recruitment, hiring, resume parsing, or job search topics. Focus strictly on mastering the technical concepts!
        """

        # Format chat history
        messages_formatted = []
        for msg in chat_history:
            role = "user" if msg.get("role") == "user" else "model"
            messages_formatted.append({"role": role, "parts": [msg.get("content", "")]})
        
        # Append current user prompt
        prompt_with_context = current_message
        if active_topic:
            prompt_with_context = f"[Active Learning Topic: {active_topic}]\n\n{current_message}"
        
        messages_formatted.append({"role": "user", "parts": [prompt_with_context]})

        if not AI_KEYS_AVAILABLE:
            return cls._get_mock_mentor_chat(current_message, active_topic)

        try:
            model = cls._get_model()
            # Merge system + history + prompt into one text block
            merged = system_instructions + "\n\n"
            for m in messages_formatted[:-1]:
                role = m.get("role", "user")
                merged += f"[{role}] {m.get('parts',[''])[0]}\n\n"
            merged += messages_formatted[-1]["parts"][0]

            body = cls._request_ai(merged)
            if isinstance(body, dict) and "choices" in body:
                text = body.get("choices", [{}])[0].get("message", {}).get("content")
                if text:
                    return {"content": text}
            if isinstance(body, dict) and "candidates" in body and body["candidates"]:
                first = body["candidates"][0]
                text = first.get("content", {}).get("text") or first.get("text") or json.dumps(first)
                return {"content": text}
            return {"content": json.dumps(body) if isinstance(body, dict) else str(body)}
        except Exception as e:
            logger.error(f"Error in AI Chat: {e}. Using mock reply.")
            return cls._get_mock_mentor_chat(current_message, active_topic)

    # -------------------------------------------------------------
    # HIGH-FIDELITY LOCAL MOCK ENGINES (NO API KEY REQUIRED FALLBACK)
    # -------------------------------------------------------------
    @classmethod
    def _get_mock_quiz(cls, domain, difficulty):
        quizzes = {
            "web development": {
                "domain": "Web Development",
                "difficulty_level": difficulty,
                "questions": [
                    {
                        "id": 1,
                        "question": "Which of the following describes the difference between Server Components and Client Components in React 18 / Next.js App Router?",
                        "options": [
                            "Server Components are rendered solely on the client, while Client Components render on the server",
                            "Server Components render on the server and do not ship JS to the client by default, while Client Components are hydrated on the client",
                            "Server Components cannot fetch data directly from databases, while Client Components can",
                            "There is no difference; they are syntactic sugar for the same runtime behavior"
                        ],
                        "correct_answer": "Server Components render on the server and do not ship JS to the client by default, while Client Components are hydrated on the client",
                        "difficulty": "intermediate",
                        "topic": "React Architecture"
                    },
                    {
                        "id": 2,
                        "question": "Consider this CSS snippet:\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n}\n```\nWhat happens when the container's width is 500px?",
                        "options": [
                            "Two columns of 250px will be rendered to fit the width",
                            "Three columns of 166px will be rendered",
                            "The container will overflow and throw a layout error",
                            "Only one column of 500px will be rendered"
                        ],
                        "correct_answer": "Two columns of 250px will be rendered to fit the width",
                        "difficulty": "intermediate",
                        "topic": "CSS Grid & Responsiveness"
                    },
                    {
                        "id": 3,
                        "question": "Identify the performance bug in this React component:\n```javascript\nfunction UserList({ users }) {\n  const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));\n  return <ul>{sortedUsers.map(u => <li key={u.id}>{u.name}</li>)}</ul>;\n}\n```",
                        "options": [
                            "Using an unordered list tag instead of an ordered list",
                            "Mutating the original 'users' prop directly using the in-place .sort() method during rendering",
                            "Using localized string comparison inside React",
                            "Failing to memoize the user elements list using useMemo"
                        ],
                        "correct_answer": "Mutating the original 'users' prop directly using the in-place .sort() method during rendering",
                        "difficulty": "advanced",
                        "topic": "React State & Performance Optimization"
                    },
                    {
                        "id": 4,
                        "question": "What is the primary benefit of HTTP/2 multiplexing over HTTP/1.1 pipelining?",
                        "options": [
                            "It encrypts request payloads at the transport layer automatically",
                            "It allows multiple request and response messages to be interleaved concurrently over a single TCP connection",
                            "It removes the need for cache-control headers by predicting browser actions",
                            "It enables browsers to load images without standard DOM tree evaluations"
                        ],
                        "correct_answer": "It allows multiple request and response messages to be interleaved concurrently over a single TCP connection",
                        "difficulty": "advanced",
                        "topic": "Web Protocols & Networking"
                    },
                    {
                        "id": 5,
                        "question": "When building responsive layouts, why is it typically recommended to use EM or REM units over PX for typography?",
                        "options": [
                            "REM units load 15% faster inside Chromium-based engines",
                            "REM/EM units respect the user's browser default font size settings, ensuring accessibility and scaling",
                            "PX units are deprecated in CSS Grid Level 3 standards",
                            "REM units allow text to automatically float in anti-gravity visual environments"
                        ],
                        "correct_answer": "REM/EM units respect the user's browser default font size settings, ensuring accessibility and scaling",
                        "difficulty": "beginner",
                        "topic": "Responsive Accessibility"
                    }
                ]
            },
            "ai/ml": {
                "domain": "AI/ML",
                "difficulty_level": difficulty,
                "questions": [
                    {
                        "id": 1,
                        "question": "What is the core difference between L1 (Lasso) and L2 (Ridge) regularization?",
                        "options": [
                            "L1 forces weights to zero causing sparsity, while L2 shrinks weights toward zero but keeps them non-zero",
                            "L2 forces weights to zero, while L1 doubles weight matrices",
                            "L1 is used only for classification, while L2 is used for clustering",
                            "L1 uses quadratic penalty, while L2 uses absolute values"
                        ],
                        "correct_answer": "L1 forces weights to zero causing sparsity, while L2 shrinks weights toward zero but keeps them non-zero",
                        "difficulty": "intermediate",
                        "topic": "Regularization Techniques"
                    },
                    {
                        "id": 2,
                        "question": "In a Transformer architecture, what is the mathematical function used to compute Self-Attention?",
                        "options": [
                            "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V",
                            "Attention(Q,K,V) = sigmoid(QK^T * d_k) + V",
                            "Attention(Q,K,V) = tanh(K^T V / d_k) * Q",
                            "Attention(Q,K,V) = relu(QV) * K"
                        ],
                        "correct_answer": "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V",
                        "difficulty": "advanced",
                        "topic": "Transformer Core"
                    },
                    {
                        "id": 3,
                        "question": "What is the primary problem that Gradient Clipping addresses in Deep Neural Networks?",
                        "options": [
                            "Vanishing Gradients in low learning rates",
                            "Exploding Gradients in Recurrent Neural Networks (RNNs)",
                            "Overfitting during batch training",
                            "Underfitting due to dead ReLU nodes"
                        ],
                        "correct_answer": "Exploding Gradients in Recurrent Neural Networks (RNNs)",
                        "difficulty": "intermediate",
                        "topic": "Gradient Tuning"
                    },
                    {
                        "id": 4,
                        "question": "Which evaluation metric is most critical when evaluating a ML model on an extremely imbalanced dataset (e.g. fraud detection)?",
                        "options": [
                            "Overall Classification Accuracy",
                            "Precision-Recall AUC / F1 Score",
                            "Mean Squared Error (MSE)",
                            "R-squared Coefficient"
                        ],
                        "correct_answer": "Precision-Recall AUC / F1 Score",
                        "difficulty": "beginner",
                        "topic": "Performance Metrics"
                    },
                    {
                        "id": 5,
                        "question": "In reinforcement learning, what does the 'Exploration vs Exploitation' dilemma refer to?",
                        "options": [
                            "Training on CPUs vs training on highly expensive GPU instances",
                            "Choosing between trying new unknown actions to find better rewards vs taking the best-known actions",
                            "Parsing datasets manually vs applying automated scraper routines",
                            "Decoupling batch sizes from deep weight learning layers"
                        ],
                        "correct_answer": "Choosing between trying new unknown actions to find better rewards vs taking the best-known actions",
                        "difficulty": "beginner",
                        "topic": "Reinforcement Learning Core"
                    }
                ]
            }
        }

        # Fallback default if domain not mapped directly
        default_quiz = {
            "domain": domain.capitalize(),
            "difficulty_level": difficulty,
            "questions": [
                {
                    "id": 1,
                    "question": f"Which of the following is a primary core design pattern in modern {domain.capitalize()} setups?",
                    "options": [
                        "Decoupled state management and modular architecture flow",
                        "Strict monolithic single-threaded blocking environments",
                        "Synchronous standard direct file-system locks",
                        "Manual machine-code instruction scheduling"
                    ],
                    "correct_answer": "Decoupled state management and modular architecture flow",
                    "difficulty": "beginner",
                    "topic": "Design Patterns"
                },
                {
                    "id": 2,
                    "question": f"What is a standard performance bottleneck in scaled {domain.capitalize()} systems?",
                    "options": [
                        "Excessive non-blocking context switches and excessive memory allocations",
                        "Unused local variable declarations",
                        "Writing comments inside production build cycles",
                        "Compiling code into localized standard libraries"
                    ],
                    "correct_answer": "Excessive non-blocking context switches and excessive memory allocations",
                    "difficulty": "intermediate",
                    "topic": "Performance & Scale"
                },
                {
                    "id": 3,
                    "question": f"In {domain.capitalize()} applications, how should asynchronous error states be caught securely?",
                    "options": [
                        "By ignoring them completely and letting threads restart",
                        "Using robust try-catch boundaries, async middleware wrappers, and graceful fallback models",
                        "Printing simple logs and immediately halting core web hosts",
                        "Converting exceptions into user alert dialogues on every thread"
                    ],
                    "correct_answer": "Using robust try-catch boundaries, async middleware wrappers, and graceful fallback models",
                    "difficulty": "advanced",
                    "topic": "Asynchronous Operations"
                },
                {
                    "id": 4,
                    "question": "What is the primary benefit of containerization (e.g. Docker) in developer environments?",
                    "options": [
                        "It speeds up internet connection speeds locally",
                        "It ensures consistent environmental dependencies and behavior from development to production",
                        "It automatically rewrites bad code logic on compile",
                        "It replaces database querying systems entirely"
                    ],
                    "correct_answer": "It ensures consistent environmental dependencies and behavior from development to production",
                    "difficulty": "beginner",
                    "topic": "DevOps Practices"
                },
                {
                    "id": 5,
                    "question": "What is the purpose of Semantic Versioning (SemVer)?",
                    "options": [
                        "To translate code syntax between programming languages automatically",
                        "To provide a standard structure of Major.Minor.Patch version numbers representing API breaking or non-breaking updates",
                        "To enforce coding conventions at compile time",
                        "To compile web assets dynamically for cloud storage"
                    ],
                    "correct_answer": "To provide a standard structure of Major.Minor.Patch version numbers representing API breaking or non-breaking updates",
                    "difficulty": "beginner",
                    "topic": "Version Control"
                }
            ]
        }

        normalized_domain = domain.lower().strip()
        return quizzes.get(normalized_domain, default_quiz)

    @classmethod
    def _get_mock_analysis(cls, domain, questions, user_answers):
        # Calculate correct score
        correct_count = 0
        total_qs = len(questions)
        weak_concepts = []
        strong_concepts = []

        for q in questions:
            qid = str(q["id"])
            topic = q["topic"]
            user_ans = user_answers.get(qid)
            correct_ans = q["correct_answer"]
            
            if user_ans == correct_ans:
                correct_count += 1
                if topic not in strong_concepts:
                    strong_concepts.append(topic)
            else:
                if topic not in weak_concepts:
                    weak_concepts.append(topic)

        score = int((correct_count / total_qs) * 100)
        
        # Default safety fallbacks
        if not weak_concepts:
            weak_concepts = ["Advanced Performance Profiling"]
        if not strong_concepts:
            strong_concepts = ["Core System Architecture"]

        confidence = "high" if score >= 80 else "medium" if score >= 50 else "low"
        speed = "fast" if score >= 80 else "normal" if score >= 50 else "steady"

        return {
            "score": score,
            "weak_concepts": weak_concepts,
            "strong_concepts": strong_concepts,
            "confidence_rating": confidence,
            "learning_speed_estimate": speed,
            "summary": f"Your assessment in {domain.capitalize()} indicates excellent aptitude in {', '.join(strong_concepts[:2])}. However, you'd benefit from deeper exposure to {', '.join(weak_concepts[:2])}. We've customized an interactive operating roadmap with selected resources targeting these exact concepts."
        }

    @classmethod
    def _get_mock_roadmap(cls, domain, weak_concepts, strong_concepts):
        # Default maps depending on domain
        domain_normalized = domain.lower().strip()
        
        # Base templates
        nodes = []
        connections = []

        if "web" in domain_normalized:
            nodes = [
                {
                    "id": "node-1",
                    "title": "React Server Architecture",
                    "description": "Master React 18/19 server-side rendering, selective hydration, and server component networks.",
                    "estimated_hours": 6,
                    "phase": "Phase 1: Core Fundamentals",
                    "status": "unlocked",
                    "resources": [
                        {"type": "video", "title": "Next.js 14 App Router Crash Course", "url": "https://www.youtube.com/results?search_query=Next.js+14+App+Router+tutorial"},
                        {"type": "docs", "title": "React Server Components Deep Dive", "url": "https://react.dev/reference/rsc/server-components"}
                    ],
                    "practice_tasks": ["Build a static blog page fetching data securely inside an RSC component."],
                    "mini_project": {
                        "title": "Minimalist Dynamic Portfolio",
                        "description": "Create a lighting-fast portfolio site using static rendering, containing dynamic MDX blog posts."
                    },
                    "x": 180,
                    "y": 150
                },
                {
                    "id": "node-2",
                    "title": f"Targeting: {weak_concepts[0] if len(weak_concepts) > 0 else 'CSS Grid & Advanced Layouts'}",
                    "description": "Intensive dive into core layouts, grid-alignments, custom responsive flex-scaling, and fluid layouts.",
                    "estimated_hours": 8,
                    "phase": "Phase 2: Deep Dive Focus",
                    "status": "locked",
                    "resources": [
                        {"type": "video", "title": "CSS Grid Layout Guide - Traversy Media", "url": "https://www.youtube.com/results?search_query=CSS+Grid+Traversy+Media"},
                        {"type": "docs", "title": "A Complete Guide to CSS Grid (CSS-Tricks)", "url": "https://css-tricks.com/snippets/css/complete-guide-grid/"}
                    ],
                    "practice_tasks": [
                        "Create a standard responsive dashboard layout with customizable grid sizing.",
                        "Re-create a responsive multi-card layout using CSS auto-fit margins."
                    ],
                    "mini_project": {
                        "title": "Cyberpunk HUD Layout Grid",
                        "description": "Construct a responsive sci-fi user dashboard using pure CSS grid layouts, showing grid cells with glowing outline frames."
                    },
                    "x": 380,
                    "y": 300
                },
                {
                    "id": "node-3",
                    "title": f"Optimization: {weak_concepts[1] if len(weak_concepts) > 1 else 'React Performance & Memoization'}",
                    "description": "Address rendering waste, state mutations, inline functions, and configure optimized rendering hooks.",
                    "estimated_hours": 10,
                    "phase": "Phase 2: Deep Dive Focus",
                    "status": "locked",
                    "resources": [
                        {"type": "video", "title": "React Performance Masterclass (useMemo, useCallback)", "url": "https://www.youtube.com/results?search_query=React+Performance+optimization"},
                        {"type": "docs", "title": "React Dev Tools & Profiling Reference", "url": "https://react.dev/reference/react/useMemo"}
                    ],
                    "practice_tasks": [
                        "Refactor an array sorting render component using React.memo and useMemo.",
                        "Track and resolve unnecessary state updates using local state boundaries."
                    ],
                    "mini_project": {
                        "title": "Quantum Real-time Data Grid",
                        "description": "Create a virtualized table display rendering 10,000 active nodes without UI lag, utilizing custom memo hooks."
                    },
                    "x": 580,
                    "y": 180
                },
                {
                    "id": "node-4",
                    "title": "Next-Gen Fullstack Capstone",
                    "description": "Build high-end server-side structures utilizing clean database connections and state updates.",
                    "estimated_hours": 14,
                    "phase": "Phase 3: Applied Architecture",
                    "status": "locked",
                    "resources": [
                        {"type": "video", "title": "Fullstack Next.js Production Scale Checklist", "url": "https://www.youtube.com/results?search_query=Next.js+full+stack+production+app"},
                        {"type": "docs", "title": "Next.js Security & Routing Practices", "url": "https://nextjs.org/docs"}
                    ],
                    "practice_tasks": ["Implement a secure API endpoint with rate limiting and JWT auth tokens."],
                    "mini_project": {
                        "title": "SkillValut X Core Workspace",
                        "description": "Merge visual dashboards, database interactions, dynamic styling, and secure user states into a single deployable capsule."
                    },
                    "x": 820,
                    "y": 320
                }
            ]
            connections = [
                {"from": "node-1", "to": "node-2"},
                {"from": "node-2", "to": "node-3"},
                {"from": "node-3", "to": "node-4"}
            ]
        else:
            # Fallback default roadmap
            nodes = [
                {
                    "id": "node-1",
                    "title": f"{domain.capitalize()} Foundations",
                    "description": f"Refresh basic elements of {domain.capitalize()} including environment structures and configuration standards.",
                    "estimated_hours": 5,
                    "phase": "Phase 1: Core Fundamentals",
                    "status": "unlocked",
                    "resources": [
                        {"type": "video", "title": f"{domain.capitalize()} for Beginners - Crash Course", "url": "https://www.youtube.com/results?search_query=" + domain.replace(" ", "+") + "+beginner"},
                        {"type": "docs", "title": "Standard Technical Getting Started Docs", "url": "https://wikipedia.org"}
                    ],
                    "practice_tasks": ["Setup a baseline repository and configure initial compiler/runtime configurations."],
                    "mini_project": {
                        "title": "Environment Configurator",
                        "description": "Script a basic environment checker verifying systems dependencies and paths."
                    },
                    "x": 180,
                    "y": 150
                },
                {
                    "id": "node-2",
                    "title": f"Targeting: {weak_concepts[0] if len(weak_concepts) > 0 else 'Advanced Mechanics'}",
                    "description": f"Targeted deep dive into {weak_concepts[0] if len(weak_concepts) > 0 else 'Advanced mechanics'} identified during quiz profiling.",
                    "estimated_hours": 9,
                    "phase": "Phase 2: Deep Dive Focus",
                    "status": "locked",
                    "resources": [
                        {"type": "video", "title": f"Deep Dive Tutorial: {weak_concepts[0] if len(weak_concepts) > 0 else 'Mechanics'}", "url": "https://www.youtube.com/results?search_query=" + (weak_concepts[0].replace(" ", "+") if len(weak_concepts) > 0 else "Advanced+Development")},
                        {"type": "docs", "title": "Developer Specification Reference Sheets", "url": "https://google.com"}
                    ],
                    "practice_tasks": ["Implement a small sub-module resolving a specific bottleneck related to this topic."],
                    "mini_project": {
                        "title": "Quantum Concept Module",
                        "description": "Construct a mock test suite validating variable parameters and checking boundary failures."
                    },
                    "x": 400,
                    "y": 320
                },
                {
                    "id": "node-3",
                    "title": "Scalability & Enterprise Layouts",
                    "description": "Ensure structures align with high performance benchmarks, concurrency models, and cloud-ready operations.",
                    "estimated_hours": 12,
                    "phase": "Phase 3: Applied Architecture",
                    "status": "locked",
                    "resources": [
                        {"type": "video", "title": "System Design & Scalability Principles", "url": "https://www.youtube.com/results?search_query=System+Design+Scaling"},
                        {"type": "docs", "title": "Architectural Guidelines for Scaled Deployment", "url": "https://wikipedia.org"}
                    ],
                    "practice_tasks": ["Design a benchmark testing script analyzing resource loads under simulated traffic."],
                    "mini_project": {
                        "title": "Enterprise Node Cluster",
                        "description": "Build an integrated full stack deployment capsule capable of scaling dynamically across localized containers."
                    },
                    "x": 750,
                    "y": 200
                }
            ]
            connections = [
                {"from": "node-1", "to": "node-2"},
                {"from": "node-2", "to": "node-3"}
            ]

        return {
            "domain": domain.capitalize(),
            "nodes": nodes,
            "connections": connections
        }

    @classmethod
    def _get_mock_mentor_chat(cls, message, active_topic=None):
        message_lower = message.lower()
        active_str = f" in **{active_topic}**" if active_topic else ""

        if "code" in message_lower or "example" in message_lower or "how to" in message_lower:
            reply = f"""
Hello, Scholar! Let's address your question{active_str} regarding optimal implementations. 

When building scalable architectures, we strive for modularity and decoupled state management. Here is a highly optimized code block demonstrating how to implement a clean async state fetch with robust exception controls:

```typescript
// Sleek developer workspace utility pattern
interface ConceptPayload {{
  id: string;
  status: 'locked' | 'unlocked' | 'completed';
  timestamp: number;
}}

export async function fetchConceptDetails(conceptId: string): Promise<ConceptPayload> {{
  try {{
    const response = await fetch(`/api/roadmap/node/${{conceptId}}`, {{
      method: 'GET',
      headers: {{ 'Content-Type': 'application/json' }}
    }});
    
    if (!response.ok) {{
      throw new Error(`Quantum API offline. Error status: ${{response.status}}`);
    }}
    
    return await response.json();
  }} catch (error) {{
    console.error("Mentor Warning ➔ Failed to sync nodes:", error);
    // Graceful offline fallback
    return {{
      id: conceptId,
      status: 'unlocked',
      timestamp: Date.now()
    }};
  }}
}}
```

### 🧠 Senior Developer Insight
Notice how this structure isolates network operations, enforces TypeScript interface bounds, and guarantees a graceful fallback payload. Let me know if you need to integrate this pattern with Next.js state or Flask controller APIs!
"""
        elif "hello" in message_lower or "hi" in message_lower:
            reply = f"""
Greetings, Engineer! 🌌 Welcome to the **SkillValut X Operating System**.

I am your **Quantum AI Mentor**, ready to guide you through your personalized roadmap. Together, we will dissect quiz results, strengthen your weak concepts, and construct outstanding custom projects.

What specific concept or programming paradigm are we leveling up on today? Let me know if you want to write some code!
"""
        else:
            reply = f"""
Excellent query! Let's explore your question{active_str}.

In the SkillValut X environment, learning concepts is represented as a structured node graph. To master this paradigm effectively:
1. **Focus on the Core Flow**: Ensure that data flows unidirectionally, maintaining high cohesion and low coupling.
2. **Implement Practical Exercises**: Complete the practice tasks specified in your roadmap nodes.
3. **Consolidate with Mini-Projects**: Writing physical code inside small projects is the fastest way to turn a weak concept into a core superpower.

Would you like me to write a clean coding demonstration or detail specific design patterns to explain this further? Just let me know what you need!
"""

        return {"content": reply}
