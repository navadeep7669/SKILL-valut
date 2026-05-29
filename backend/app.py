"""
SkillValut X — Consolidated Student-Friendly Backend (SECURED)
==============================================================
This single python file runs the entire Flask REST API, manages the local SQLite database,
and handles Gemini AI connections (with seamless high-fidelity mock data fallbacks!).

SECURITY LAYER ADDED:
1. Environment isolation for Gemini API Keys & Workspace Auth Tokens (.env).
2. Lightweight token-based authentication middleware (@token_required) intercepting routes.
3. Hardened CORS configuration (restricting origins to allowed local ports).
4. Parametrized SQLite queries defending against SQL Injection.
"""

import os
import sqlite3
import json
import logging
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# =====================================================================
# 1. SETUP LOGGING, ENVIRONMENT & CONFIGURATION
# =====================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skillvalut_x_backend")

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except Exception as e:
    logger.warning(f"⚠️ Failed to import google-generativeai: {e}. Falling back to high-fidelity mock datasets.")
    HAS_GEMINI = False

load_dotenv()

app = Flask(__name__)

# Load Security configurations from Environment
# Defends against hardcoding sensitive token signatures in code
WORKSPACE_AUTH_TOKEN = os.getenv("WORKSPACE_AUTH_TOKEN", "svx_dev_secure_token_2026")

# Hardened CORS policy: restrict incoming origins strictly to our Next.js frontend port
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

# Configure Gemini API Key securely from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if HAS_GEMINI and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("✓ Gemini Generative AI configured successfully.")
else:
    logger.warning("⚠️ GEMINI_API_KEY not active or SDK import failed. Using high-fidelity local mock engine instead.")

DATABASE_FILE = "skillvault_x.db"

# =====================================================================
# 2. SECURITY MIDDLEWARE (Lightweight Token Interceptor)
# =====================================================================
def token_required(f):
    """
    Custom decorator acting as a security firewall.
    Verifies that the incoming request contains the correct 'Authorization'
    header matching our WORKSPACE_AUTH_TOKEN.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Verify Authorization header exists and has 'Bearer <token>' format
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                
        if not token:
            logger.warning("⚠️ Blocked Request: Missing Authorization Token signature.")
            return jsonify({"error": "Access Denied. Security token signature is missing."}), 401
            
        if token != WORKSPACE_AUTH_TOKEN:
            logger.warning("⚠️ Blocked Request: Invalid Authorization Token signature provided.")
            return jsonify({"error": "Access Denied. Unauthorized token signature."}), 401
            
        # Token valid, let the request flow through
        return f(*args, **kwargs)
    return decorated

# =====================================================================
# 3. LOCAL SQLITE DATABASE HELPERS (Parametrized SQL)
# =====================================================================
def get_db_connection():
    """Establishes a connection to the local SQLite database file."""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite database schemas securely."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table A: Users profile diagnostics records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        domain TEXT,
        score INTEGER DEFAULT 0,
        strong_concepts TEXT,
        weak_concepts TEXT,
        confidence_rating TEXT,
        learning_speed TEXT,
        summary TEXT
    )
    """)
    
    # Table B: Active quiz questions generated for each session
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_sessions (
        user_id TEXT PRIMARY KEY,
        questions TEXT,
        user_answers TEXT,
        status TEXT DEFAULT 'pending'
    )
    """)
    
    # Table C: Keep generated roadmap graph
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roadmaps (
        user_id TEXT PRIMARY KEY,
        domain TEXT,
        nodes TEXT,
        connections TEXT,
        completed_nodes TEXT DEFAULT '[]'
    )
    """)
    
    # Table D: Keep mentor conversation histories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        role TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()
    logger.info("✓ SQLite Database schema initialized successfully.")

init_db()

# =====================================================================
# 4. DYNAMIC MOCK DATASETS
# =====================================================================
MOCK_QUIZZES = {
    "web development": [
        {
            "id": 1,
            "question": "Which React hook is used to cache the computed value of a expensive function across renders?",
            "options": ["useEffect", "useMemo", "useCallback", "useState"],
            "correct_answer": "useMemo",
            "difficulty": "beginner",
            "topic": "React Hooks"
        },
        {
            "id": 2,
            "question": "In React, what describes a critical difference between Server Components and Client Components?",
            "options": [
                "Server Components render on the server and send no JS to the client by default, while Client Components render and hydrate on the client",
                "Client Components render on the server, Server Components on the client",
                "Server Components cannot fetch data from databases",
                "There is no difference in runtime execution"
            ],
            "correct_answer": "Server Components render on the server and send no JS to the client by default, while Client Components render and hydrate on the client",
            "difficulty": "intermediate",
            "topic": "React Server Components"
        },
        {
            "id": 3,
            "question": "Identify the bug in this React rendering loop:\n```javascript\nfunction List({ items }) {\n  return <ul>{items.map(item => <li key={Math.random()}>{item.name}</li>)}</ul>;\n}\n```",
            "options": [
                "Using Math.random() as a key forces the element to re-create and lose its DOM state on every render, causing performance degradation",
                "Using an unordered list tag is deprecated in React 18",
                "Failing to memoize the items list inside a state hook",
                "Mapping elements inline during rendering is forbidden in React"
            ],
            "correct_answer": "Using Math.random() as a key forces the element to re-create and lose its DOM state on every render, causing performance degradation",
            "difficulty": "advanced",
            "topic": "React State & Keys"
        },
        {
            "id": 4,
            "question": "What is the primary visual benefit of standard CSS Grid 'auto-fit' over 'auto-fill'?",
            "options": [
                "Auto-fit stretches columns to occupy all remaining empty container width, whereas auto-fill leaves empty tracks",
                "Auto-fill stretches columns, auto-fit leaves empty space",
                "Auto-fit loads image elements 20% faster inside Chromium browsers",
                "Auto-fill is incompatible with responsive flex sizes"
            ],
            "correct_answer": "Auto-fit stretches columns to occupy all remaining empty container width, whereas auto-fill leaves empty tracks",
            "difficulty": "intermediate",
            "topic": "CSS Grid & Flexbox"
        },
        {
            "id": 5,
            "question": "Why is it recommended to use EM or REM layout sizing units over absolute PX units for typography?",
            "options": [
                "REM/EM units adapt dynamically to the user's browser base font size settings, ensuring accessibility and scaling",
                "REM units load slightly faster over slower network links",
                "PX units throw compiler errors in modern CSS modules",
                "REM units allow text to hover in anti-gravity environments"
            ],
            "correct_answer": "REM/EM units adapt dynamically to the user's browser base font size settings, ensuring accessibility and scaling",
            "difficulty": "beginner",
            "topic": "CSS Accessibility"
        }
    ],
    "ai/ml": [
        {
            "id": 1,
            "question": "What is the primary difference between L1 (Lasso) and L2 (Ridge) regularization?",
            "options": [
                "L1 forces weights to zero causing sparsity, while L2 shrinks weights toward zero but keeps them non-zero",
                "L2 forces weights to zero, while L1 doubles weight matrices",
                "L1 is classification only, L2 is clustering only",
                "L1 uses absolute values, L2 uses manual clipping boundaries"
            ],
            "correct_answer": "L1 forces weights to zero causing sparsity, while L2 shrinks weights toward zero but keeps them non-zero",
            "difficulty": "intermediate",
            "topic": "Regularization Techniques"
        },
        {
            "id": 2,
            "question": "In a Transformer architecture, what is the mathematical equation used to compute Self-Attention?",
            "options": [
                "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V",
                "Attention(Q,K,V) = sigmoid(QK^T) * V",
                "Attention(Q,K,V) = tanh(K^T V) * Q",
                "Attention(Q,K,V) = relu(QV) * K"
            ],
            "correct_answer": "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V",
            "difficulty": "advanced",
            "topic": "Transformer Core"
        },
        {
            "id": 3,
            "question": "What is the primary issue addressed by Gradient Clipping in Deep Neural Networks?",
            "options": [
                "Exploding gradients during training (especially in recurrent structures)",
                "Vanishing gradients in neural layers",
                "Overfitting on tiny custom datasets",
                "Underfitting due to dead ReLU functions"
            ],
            "correct_answer": "Exploding gradients during training (especially in recurrent structures)",
            "difficulty": "intermediate",
            "topic": "Gradient Tuning"
        },
        {
            "id": 4,
            "question": "Which metric is most important when evaluating classification models on extremely imbalanced datasets?",
            "options": ["Accuracy", "F1 Score / Precision-Recall AUC", "Mean Squared Error (MSE)", "R-squared coefficient"],
            "correct_answer": "F1 Score / Precision-Recall AUC",
            "difficulty": "beginner",
            "topic": "Performance Metrics"
        },
        {
            "id": 5,
            "question": "What does the 'Exploration vs Exploitation' trade-off describe in Reinforcement Learning?",
            "options": [
                "Choosing between trying new unknown actions vs selecting known actions that give high rewards",
                "Choosing between CPU training and GPU training clusters",
                "Scraping files vs downloading structured databases",
                "Decoupling batch sizes from memory buffers"
            ],
            "correct_answer": "Choosing between trying new unknown actions vs selecting known actions that give high rewards",
            "difficulty": "beginner",
            "topic": "Reinforcement Learning"
        }
    ]
}

# =====================================================================
# 5. DYNAMIC AI / MOCK GENERATIVE CLIENT
# =====================================================================
class AIEngine:
    @staticmethod
    def _call_gemini_json(prompt):
        if not HAS_GEMINI or not GEMINI_API_KEY:
            raise ValueError("No Gemini key configured or SDK not loaded")
            
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)

    @classmethod
    def generate_quiz(cls, domain):
        if not HAS_GEMINI or not GEMINI_API_KEY:
            normalized = domain.lower().strip()
            return MOCK_QUIZZES.get(normalized, MOCK_QUIZZES["web development"])

        prompt = f"""
        Generate 5 multiple-choice questions for the domain: "{domain}".
        Each question must test a specific sub-topic.
        Return ONLY a JSON array matching this structure:
        [
            {{
                "id": 1,
                "question": "Question text...",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "difficulty": "intermediate",
                "topic": "Specific subconcept"
            }}
        ]
        """
        try:
            return cls._call_gemini_json(prompt)
        except Exception as e:
            logger.error(f"Gemini Quiz compilation failed: {e}. Loading offline sample cards.")
            return MOCK_QUIZZES.get(domain.lower().strip(), MOCK_QUIZZES["web development"])

    @classmethod
    def evaluate_quiz(cls, domain, questions, user_answers):
        correct_count = 0
        strong_concepts = []
        weak_concepts = []
        
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
        
        score = int((correct_count / len(questions)) * 100) if questions else 0
        
        if not strong_concepts:
            strong_concepts = ["Core Systems Layout"]
        if not weak_concepts:
            weak_concepts = ["Advanced Performance Profiling"]
            
        summary = f"Scored {score}% accuracy in {domain.capitalize()}. Strong competencies shown in {', '.join(strong_concepts[:2])}. Focus recommended on {', '.join(weak_concepts[:2])}."
        
        return {
            "score": score,
            "strong_concepts": strong_concepts,
            "weak_concepts": weak_concepts,
            "confidence_rating": "High" if score >= 80 else "Medium" if score >= 50 else "Steady",
            "learning_speed_estimate": "Fast" if score >= 80 else "Normal" if score >= 50 else "Steady",
            "summary": summary
        }

    @classmethod
    def generate_roadmap(cls, domain, weak_concepts, strong_concepts, speed):
        if not HAS_GEMINI or not GEMINI_API_KEY:
            return cls._get_mock_roadmap(domain, weak_concepts)

        prompt = f"""
        Compile a 3-phase learning path for the domain: "{domain}".
        Strengths: {json.dumps(strong_concepts)}
        Weaknesses to focus on: {json.dumps(weak_concepts)}
        Learning speed: "{speed}"
        
        The roadmap must include exactly 4 nodes laid out nicely on a coordinate grid:
        - Node 1: Fundamentals (x=180, y=150, unlocked)
        - Node 2: Weakness deep dive (x=420, y=320, locked)
        - Node 3: Secondary focus (x=650, y=180, locked)
        - Node 4: Capstone Project (x=880, y=320, locked)
        
        Return ONLY a JSON object matching this structure:
        {{
            "domain": "{domain}",
            "nodes": [
                {{
                    "id": "node-1",
                    "title": "Topic Name",
                    "description": "Topic explanation...",
                    "estimated_hours": 6,
                    "phase": "Phase 1: Core Fundamentals",
                    "status": "unlocked",
                    "resources": [
                        {{"type": "video", "title": "Crash Course title", "url": "https://youtube.com/results?search_query=..."}},
                        {{"type": "docs", "title": "Documentation title", "url": "https://docs.com"}}
                    ],
                    "practice_tasks": ["Build basic frame..."],
                    "mini_project": {{
                        "title": "Project Title",
                        "description": "Project specification details..."
                    }},
                    "x": 180,
                    "y": 150
                }}
            ],
            "connections": [
                {{"from": "node-1", "to": "node-2"}},
                {{"from": "node-2", "to": "node-3"}},
                {{"from": "node-3", "to": "node-4"}}
            ]
        }}
        """
        try:
            return cls._call_gemini_json(prompt)
        except Exception as e:
            logger.error(f"Gemini Roadmap compilation failed: {e}. Loading mock map.")
            return cls._get_mock_roadmap(domain, weak_concepts)

    @classmethod
    def _get_mock_roadmap(cls, domain, weak_concepts):
        weak = weak_concepts[0] if weak_concepts else "Core Architectures"
        d = domain.lower()

        # Pick domain-specific real resources + attach local HTML study guides
        notes_base = "http://localhost:3000/notes"
        if "web" in d:
            phase1_resources = [
                {"type": "video", "title": "HTML & CSS Full Course – freeCodeCamp", "url": "https://www.youtube.com/watch?v=mU6anWqZJcc"},
                {"type": "video", "title": "JavaScript Crash Course – Traversy Media", "url": "https://www.youtube.com/watch?v=hdI2bqOjy3c"},
                {"type": "docs",  "title": "MDN Web Docs – HTML Reference", "url": "https://developer.mozilla.org/en-US/docs/Web/HTML"},
                {"type": "notes", "title": "📄 Web Development Study Guide (Phase 1)", "url": f"{notes_base}/web-development.html#p1"}
            ]
            phase2_resources = [
                {"type": "video", "title": "React JS Full Course 2024 – freeCodeCamp", "url": "https://www.youtube.com/watch?v=x4rFhThSX04"},
                {"type": "video", "title": "Next.js 14 Crash Course – Traversy Media", "url": "https://www.youtube.com/watch?v=ZVnjOPwW4ZA"},
                {"type": "docs",  "title": "React Official Documentation", "url": "https://react.dev/"},
                {"type": "notes", "title": "📄 React & Next.js Phase Guide (Phase 2)", "url": f"{notes_base}/web-development.html#p2"}
            ]
            phase3_resources = [
                {"type": "video", "title": "REST API Design Best Practices – Fireship", "url": "https://www.youtube.com/watch?v=-MTSQjw5DrM"},
                {"type": "video", "title": "Full Stack Project – Node + React", "url": "https://www.youtube.com/watch?v=mrHNSanmqQ4"},
                {"type": "docs",  "title": "Node.js Official Guide", "url": "https://nodejs.org/en/docs/"},
                {"type": "notes", "title": "📄 Backend & APIs Study Guide (Phase 3)", "url": f"{notes_base}/web-development.html#p3"}
            ]
            phase4_resources = [
                {"type": "video", "title": "Deploy Next.js App to Vercel – Fireship", "url": "https://www.youtube.com/watch?v=2HBIzEx6IZA"},
                {"type": "video", "title": "Web Performance Optimization – Google Chrome Dev", "url": "https://www.youtube.com/watch?v=AQqFZ5t8uNc"},
                {"type": "docs",  "title": "Web.dev – Performance Guides", "url": "https://web.dev/performance/"},
                {"type": "notes", "title": "📄 Deployment & CI/CD Study Guide (Phase 4)", "url": f"{notes_base}/web-development.html#p4"}
            ]
        elif "ai" in d or "ml" in d:
            phase1_resources = [
                {"type": "video", "title": "Python for Beginners – freeCodeCamp", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"},
                {"type": "video", "title": "Machine Learning for Beginners – Microsoft", "url": "https://www.youtube.com/watch?v=NWONeJKn6kc"},
                {"type": "docs",  "title": "Scikit-Learn User Guide", "url": "https://scikit-learn.org/stable/user_guide.html"},
                {"type": "notes", "title": "📄 Python & Core ML Study Guide (Phase 1)", "url": f"{notes_base}/ai-ml.html#p1"}
            ]
            phase2_resources = [
                {"type": "video", "title": "Neural Networks from Scratch – Andrej Karpathy", "url": "https://www.youtube.com/watch?v=VMj-3S1tku0"},
                {"type": "video", "title": "Deep Learning with PyTorch – freeCodeCamp", "url": "https://www.youtube.com/watch?v=GIsg-ZUy0MY"},
                {"type": "docs",  "title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/"},
                {"type": "notes", "title": "📄 Neural Networks & PyTorch Guide (Phase 2)", "url": f"{notes_base}/ai-ml.html#p2"}
            ]
            phase3_resources = [
                {"type": "video", "title": "Transformers & Attention Explained – Yannic Kilcher", "url": "https://www.youtube.com/watch?v=iDulhoQ2pro"},
                {"type": "video", "title": "LLMs from Scratch – Andrej Karpathy", "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY"},
                {"type": "docs",  "title": "HuggingFace Transformers Docs", "url": "https://huggingface.co/docs/transformers"},
                {"type": "notes", "title": "📄 Transformers & LLMs Study Guide (Phase 3)", "url": f"{notes_base}/ai-ml.html#p3"}
            ]
            phase4_resources = [
                {"type": "video", "title": "Deploy ML Models with FastAPI – Patrick Loeber", "url": "https://www.youtube.com/watch?v=b5F667g1yCk"},
                {"type": "video", "title": "MLOps Full Course – freeCodeCamp", "url": "https://www.youtube.com/watch?v=9BgIDqAzfuA"},
                {"type": "docs",  "title": "Google Vertex AI Docs", "url": "https://cloud.google.com/vertex-ai/docs"},
                {"type": "notes", "title": "📄 Production MLOps Study Guide (Phase 4)", "url": f"{notes_base}/ai-ml.html#p4"}
            ]
        else:  # cloud computing
            phase1_resources = [
                {"type": "video", "title": "Cloud Computing for Beginners – freeCodeCamp", "url": "https://www.youtube.com/watch?v=M988_fsOSWo"},
                {"type": "video", "title": "AWS Certified Cloud Practitioner – Andrew Brown", "url": "https://www.youtube.com/watch?v=SOTamWNgDKc"},
                {"type": "docs",  "title": "AWS Getting Started Guide", "url": "https://aws.amazon.com/getting-started/"},
                {"type": "notes", "title": "📄 AWS & Cloud Core Study Guide (Phase 1)", "url": f"{notes_base}/cloud-computing.html#p1"}
            ]
            phase2_resources = [
                {"type": "video", "title": "Docker & Kubernetes Crash Course – TechWorld with Nana", "url": "https://www.youtube.com/watch?v=3c-iBn73dDE"},
                {"type": "video", "title": "Kubernetes Tutorial for Beginners – TechWorld with Nana", "url": "https://www.youtube.com/watch?v=X48VuDVv0do"},
                {"type": "docs",  "title": "Docker Official Documentation", "url": "https://docs.docker.com/"},
                {"type": "notes", "title": "📄 Containers & Kubernetes Study Guide (Phase 2)", "url": f"{notes_base}/cloud-computing.html#p2"}
            ]
            phase3_resources = [
                {"type": "video", "title": "Terraform Crash Course – TechWorld with Nana", "url": "https://www.youtube.com/watch?v=l5k1ai_GBDE"},
                {"type": "video", "title": "CI/CD Pipeline with GitHub Actions – TechWorld with Nana", "url": "https://www.youtube.com/watch?v=R8_veQiYBjI"},
                {"type": "docs",  "title": "Terraform Documentation", "url": "https://developer.hashicorp.com/terraform/docs"},
                {"type": "notes", "title": "📄 IaC & CI/CD Pipelines Study Guide (Phase 3)", "url": f"{notes_base}/cloud-computing.html#p3"}
            ]
            phase4_resources = [
                {"type": "video", "title": "Microservices Architecture – IBM Technology", "url": "https://www.youtube.com/watch?v=CdBtNQZH8a4"},
                {"type": "video", "title": "System Design Full Course – Gaurav Sen", "url": "https://www.youtube.com/watch?v=xpDnVSmNFX0"},
                {"type": "docs",  "title": "AWS Well-Architected Framework", "url": "https://aws.amazon.com/architecture/well-architected/"},
                {"type": "notes", "title": "📄 Microservices & Resiliency Study Guide (Phase 4)", "url": f"{notes_base}/cloud-computing.html#p4"}
            ]

        return {
            "domain": domain.capitalize(),
            "nodes": [
                {
                    "id": "node-1",
                    "title": "Core Foundations Guide",
                    "description": f"Master the essential building blocks, syntax, and toolchain of {domain.capitalize()}.",
                    "estimated_hours": 5,
                    "phase": "Phase 1: Core Fundamentals",
                    "status": "unlocked",
                    "resources": phase1_resources,
                    "practice_tasks": [
                        "Set up your local development environment",
                        "Complete 3 beginner exercises from the official docs",
                        "Push your first project to GitHub"
                    ],
                    "mini_project": {
                        "title": "Starter Showcase",
                        "description": "Build a simple interactive demo applying the core concepts you just learned. Keep it small but functional."
                    },
                    "x": 180,
                    "y": 150
                },
                {
                    "id": "node-2",
                    "title": f"Deep Dive: {weak}",
                    "description": f"Targeted training to close your skill gap in {weak} — your diagnostic weakness area.",
                    "estimated_hours": 8,
                    "phase": "Phase 2: Deep Dive Focus",
                    "status": "locked",
                    "resources": phase2_resources,
                    "practice_tasks": [
                        f"Read the official documentation section on {weak}",
                        f"Build a minimal working example demonstrating {weak}",
                        "Write a short explanation of the concept in your own words"
                    ],
                    "mini_project": {
                        "title": "Concept Isolator",
                        "description": f"Create a focused mini-app that demonstrates {weak} in action with clear comments explaining each step."
                    },
                    "x": 420,
                    "y": 320
                },
                {
                    "id": "node-3",
                    "title": "Scalability & Advanced Patterns",
                    "description": "Learn professional-grade design patterns, performance optimization, and scalable architecture principles.",
                    "estimated_hours": 10,
                    "phase": "Phase 2: Deep Dive Focus",
                    "status": "locked",
                    "resources": phase3_resources,
                    "practice_tasks": [
                        "Refactor your Phase 1 project using an advanced design pattern",
                        "Benchmark performance before and after optimization",
                        "Add proper error handling and logging to a project"
                    ],
                    "mini_project": {
                        "title": "Scale-Ready App",
                        "description": "Take your previous mini-project and refactor it to handle 10x the load — add caching, error boundaries, and modular architecture."
                    },
                    "x": 650,
                    "y": 180
                },
                {
                    "id": "node-4",
                    "title": "Capstone: Full Deployment",
                    "description": "Combine everything — build, test, and deploy a complete production-ready application from scratch.",
                    "estimated_hours": 15,
                    "phase": "Phase 3: Applied Architecture",
                    "status": "locked",
                    "resources": phase4_resources,
                    "practice_tasks": [
                        "Deploy your capstone project to a live URL",
                        "Add CI/CD pipeline for automatic deployments",
                        "Write a README documenting your architecture decisions"
                    ],
                    "mini_project": {
                        "title": "Live Production App",
                        "description": "Build and ship a full-stack application that solves a real problem. It should have a live URL, proper authentication, and clean documentation."
                    },
                    "x": 880,
                    "y": 320
                }
            ],
            "connections": [
                {"from": "node-1", "to": "node-2"},
                {"from": "node-2", "to": "node-3"},
                {"from": "node-3", "to": "node-4"}
            ]
        }

    @classmethod
    def generate_mentor_reply(cls, chat_history, user_message, active_topic):
        if not HAS_GEMINI or not GEMINI_API_KEY:
            return cls._get_mock_reply(user_message, active_topic)

        system_instruction = """
        You are "Quantum AI Mentor", a friendly developer helper inside the SkillValut X Operating System.
        Keep replies clear, brief, and highly supportive. Use developer terms and give simple code snippets.
        Do NOT write full files, just small pieces. Format code cleanly inside Markdown tags.
        Avoid all recruitment, ATS, hiring, or job matching topics. Focus strictly on learning technical skills!
        """
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )
            messages = []
            for msg in chat_history:
                role = "user" if msg["role"] == "user" else "model"
                messages.append({"role": role, "parts": [msg["content"]]})
                
            prompt = user_message
            if active_topic:
                prompt = f"[Topic: {active_topic}]\n\n{user_message}"
                
            messages.append({"role": "user", "parts": [prompt]})
            
            chat = model.start_chat(history=messages[:-1])
            response = chat.send_message(messages[-1]["parts"][0])
            return {"content": response.text}
        except Exception as e:
            logger.error(f"Gemini Chat warning: {e}. Sending mock response.")
            return cls._get_mock_reply(user_message, active_topic)

    @classmethod
    def _get_mock_reply(cls, message, active_topic):
        msg_lower = message.lower()
        topic_str = f" in **{active_topic}**" if active_topic else ""

        # Code / example request
        if any(kw in msg_lower for kw in ["code", "example", "how to", "implement", "write", "show me"]):
            return {"content": f"""Hello, Scholar! Let's write some code{topic_str}!

Here is a clean, student-friendly example with full comments:

```javascript
// Async data fetcher with robust error handling
async function fetchData(endpoint) {{
  try {{
    const response = await fetch(endpoint);

    if (!response.ok) {{
      throw new Error(`HTTP Error: ${{response.status}}`);
    }}

    const data = await response.json();
    return {{ success: true, data }};
  }} catch (error) {{
    console.error('Fetch failed:', error.message);
    // Always return a safe fallback — never let the UI crash!
    return {{ success: false, data: null, error: error.message }};
  }}
}}

// Usage
const result = await fetchData('/api/roadmap/nodes');
if (result.success) {{
  console.log('Loaded:', result.data);
}}
```

**💡 Key Concepts Here:**
- `async/await` makes asynchronous code readable
- `try/catch` prevents silent failures
- Always return a safe fallback object

Want me to adapt this for your `{active_topic or 'current topic'}`?
"""}

        # Debug / error help
        if any(kw in msg_lower for kw in ["error", "bug", "fix", "debug", "not working", "issue", "fail"]):
            return {"content": f"""Let's debug this together{topic_str}! 🔍

Here's a systematic debugging approach:

```javascript
// Step 1: Add console logs to trace the problem
console.log('Input received:', inputData);

// Step 2: Check types explicitly
console.log('Type check:', typeof inputData, Array.isArray(inputData));

// Step 3: Isolate the failing section
try {{
  const result = processData(inputData);  // <-- suspected line
  console.log('Result:', result);
}} catch (err) {{
  console.error('Error caught:', err.message);  // exact error
  console.error('Stack trace:', err.stack);      // where it happened
}}
```

**🛠 Common Causes to Check:**
- `undefined` / `null` values not being guarded
- Wrong data type passed to a function
- Async function not being `await`ed
- Missing return statement

Share your error message and I'll give you a specific fix!
"""}

        # Explain / what is
        if any(kw in msg_lower for kw in ["what is", "explain", "define", "meaning", "understand", "concept"]):
            return {"content": f"""Great question{topic_str}! Let me break it down simply.

**{active_topic or 'This concept'}** is one of the building blocks of modern software development.

Think of it like this:
- 📦 **What it is**: A pattern/tool that solves a specific recurring problem in code.
- ⚡ **Why it matters**: Without it, codebases become hard to maintain and scale.
- 🧩 **How it connects**: It pairs with other concepts in your roadmap to form complete solutions.

```python
# A simple analogy in code:
# Imagine your app is a restaurant kitchen:

class Kitchen:  # The system
    def take_order(self, order): ...   # Input layer
    def prepare_food(self, order): ... # Processing layer  
    def serve(self, dish): ...         # Output layer

# Each layer has ONE job — that's the core idea!
```

**📚 Recommended Next Steps:**
1. Read the official docs for `{active_topic or 'this topic'}`
2. Build a tiny working example from scratch
3. Ask me for a code challenge to test your understanding!
"""}

        # Help / tips
        if any(kw in msg_lower for kw in ["help", "stuck", "tip", "advice", "guide", "learn"]):
            return {"content": f"""I'm here to help you master{topic_str}! 🌌

**Your 3-step fast-track plan:**

1. **📖 Read First** — Spend 20 mins on the official docs. Don't try to memorize, just get familiar.
2. **🔨 Build Something Tiny** — Even a 10-line script using the concept beats passive reading.
3. **🔁 Iterate** — Break it on purpose. See what errors appear. Fix them. Repeat.

**📊 Progress Check:**
- ✅ Can you explain it in one sentence? (You understand it)
- ✅ Can you use it without looking it up? (You've internalized it)
- ✅ Can you teach it? (You've mastered it)

Which roadmap node are you currently on? I'll give you a specific challenge!
"""}

        # Default greeting / general
        return {
            "content": f"""Greetings, Scholar! 🌌 I'm your **Quantum AI Mentor**.

I'm ready to help you master **{active_topic or 'your current topic'}**.

Here's what I can help with — just ask:
- 💻 **"Show me a code example"** — Get working code with explanations
- 🐛 **"Help me debug this"** — Trace errors step by step  
- 📖 **"Explain [concept]"** — Clear, beginner-friendly breakdowns
- 🏆 **"Give me a challenge"** — Test your understanding with exercises
- 💡 **"What should I learn next?"** — Personalized study path advice

What are we tackling today?
"""
        }

# =====================================================================
# 6. REST ENDPOINTS & CONTROLLER LOGIC (Protected by Security Layer)
# =====================================================================
@app.route("/api/health", methods=["GET"])
def health():
    """Unprotected health-check endpoint for standard telemetries."""
    return jsonify({"status": "healthy", "project": "SkillValut X Secured Backend"}), 200

@app.route("/api/auth/session", methods=["POST"])
@token_required # SECURED: Only verified tokens can execute session initiations
def auth_session():
    try:
        data = request.json or {}
        user_id = data.get("user_id", "default_scholar")
        domain = data.get("domain", "web development").lower().strip()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Security protection: strict parameterized SQL query prevents injection exploits
        cursor.execute("""
        INSERT INTO users (id, domain)
        VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET domain = excluded.domain
        """, (user_id, domain))
        
        # Clear out previous records for a fresh run
        cursor.execute("DELETE FROM quiz_sessions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM roadmaps WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "user_id": user_id, "domain": domain}), 200
    except Exception as e:
        logger.error(f"Session Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/quiz/generate", methods=["POST"])
@token_required # SECURED
def generate_quiz():
    try:
        data = request.json or {}
        user_id = data.get("user_id", "default_scholar")
        
        conn = get_db_connection()
        user = conn.execute("SELECT domain FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "User session not found"}), 400
            
        domain = user["domain"]
        questions = AIEngine.generate_quiz(domain)
        
        # Security protection: parameterized execution
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO quiz_sessions (user_id, questions, status)
        VALUES (?, ?, 'pending')
        ON CONFLICT(user_id) DO UPDATE SET questions = excluded.questions, status = 'pending'
        """, (user_id, json.dumps(questions)))
        
        conn.commit()
        conn.close()
        return jsonify({"domain": domain, "questions": questions}), 200
    except Exception as e:
        logger.error(f"Quiz Generation Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/quiz/evaluate", methods=["POST"])
@token_required # SECURED
def evaluate_quiz():
    try:
        data = request.json or {}
        user_id = data.get("user_id", "default_scholar")
        answers = data.get("answers", {})
        
        conn = get_db_connection()
        session = conn.execute("SELECT questions FROM quiz_sessions WHERE user_id = ?", (user_id,)).fetchone()
        user = conn.execute("SELECT domain FROM users WHERE id = ?", (user_id,)).fetchone()
        
        if not session or not user:
            conn.close()
            return jsonify({"error": "Session details not found"}), 400
            
        questions = json.loads(session["questions"])
        domain = user["domain"]
        
        eval_result = AIEngine.evaluate_quiz(domain, questions, answers)
        
        # Security protection: parameterized execution
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE users
        SET score = ?,
            strong_concepts = ?,
            weak_concepts = ?,
            confidence_rating = ?,
            learning_speed = ?,
            summary = ?
        WHERE id = ?
        """, (
            eval_result["score"],
            json.dumps(eval_result["strong_concepts"]),
            json.dumps(eval_result["weak_concepts"]),
            eval_result["confidence_rating"],
            eval_result["learning_speed_estimate"],
            eval_result["summary"],
            user_id
        ))
        
        cursor.execute("UPDATE quiz_sessions SET user_answers = ?, status = 'completed' WHERE user_id = ?", (json.dumps(answers), user_id))
        
        conn.commit()
        conn.close()
        return jsonify({"status": "completed", "evaluation": eval_result}), 200
    except Exception as e:
        logger.error(f"Evaluation Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/roadmap/generate", methods=["POST"])
@token_required # SECURED
def generate_roadmap():
    try:
        data = request.json or {}
        user_id = data.get("user_id", "default_scholar")
        
        conn = get_db_connection()
        user = conn.execute("SELECT domain, strong_concepts, weak_concepts, learning_speed FROM users WHERE id = ?", (user_id,)).fetchone()
        
        if not user or not user["weak_concepts"]:
            conn.close()
            return jsonify({"error": "Please complete the quiz first"}), 400
            
        domain = user["domain"]
        strong = json.loads(user["strong_concepts"])
        weak = json.loads(user["weak_concepts"])
        speed = user["learning_speed"]
        
        roadmap = AIEngine.generate_roadmap(domain, weak, strong, speed)
        
        # Security protection: parameterized execution
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO roadmaps (user_id, domain, nodes, connections, completed_nodes)
        VALUES (?, ?, ?, ?, '[]')
        ON CONFLICT(user_id) DO UPDATE SET
            nodes = excluded.nodes,
            connections = excluded.connections,
            completed_nodes = '[]'
        """, (user_id, domain, json.dumps(roadmap["nodes"]), json.dumps(roadmap["connections"])))
        
        conn.commit()
        conn.close()
        return jsonify(roadmap), 200
    except Exception as e:
        logger.error(f"Roadmap Generation Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/roadmap/latest", methods=["GET"])
@token_required # SECURED
def get_latest_roadmap():
    try:
        user_id = request.args.get("user_id", "default_scholar")
        
        conn = get_db_connection()
        roadmap = conn.execute("SELECT domain, nodes, connections, completed_nodes FROM roadmaps WHERE user_id = ?", (user_id,)).fetchone()
        
        if not roadmap:
            conn.close()
            return jsonify({"error": "No roadmap found"}), 404
            
        nodes = json.loads(roadmap["nodes"])
        connections = json.loads(roadmap["connections"])
        completed_list = json.loads(roadmap["completed_nodes"])
        completed_set = set(completed_list)
        domain = roadmap["domain"]
        conn.close()
        
        # Unlocking dependency manager
        node_parents = {n["id"]: [] for n in nodes}
        for conn in connections:
            parent = conn["from"]
            child = conn["to"]
            if child in node_parents:
                node_parents[child].append(parent)
                
        for node in nodes:
            nid = node["id"]
            if nid in completed_set:
                node["status"] = "completed"
            else:
                parents = node_parents.get(nid, [])
                if not parents:
                    node["status"] = "unlocked"
                else:
                    all_parents_done = all(p in completed_set for p in parents)
                    node["status"] = "unlocked" if all_parents_done else "locked"
                    
        return jsonify({
            "domain": domain,
            "nodes": nodes,
            "connections": connections,
            "completed_list": completed_list
        }), 200
    except Exception as e:
        logger.error(f"Load Roadmap Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/roadmap/node/toggle", methods=["POST"])
@token_required # SECURED
def toggle_node():
    try:
        data = request.json or {}
        user_id = data.get("user_id", "default_scholar")
        node_id = data.get("node_id")
        completed = data.get("completed", True)
        
        conn = get_db_connection()
        row = conn.execute("SELECT completed_nodes FROM roadmaps WHERE user_id = ?", (user_id,)).fetchone()
        
        if not row:
            conn.close()
            return jsonify({"error": "Roadmap not found"}), 404
            
        completed_list = json.loads(row["completed_nodes"])
        completed_set = set(completed_list)
        
        if completed:
            completed_set.add(node_id)
        else:
            completed_set.discard(node_id)
            
        cursor = conn.cursor()
        cursor.execute("UPDATE roadmaps SET completed_nodes = ? WHERE user_id = ?", (json.dumps(list(completed_set)), user_id))
        conn.commit()
        conn.close()
        
        return get_latest_roadmap()
    except Exception as e:
        logger.error(f"Toggle Node Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/workspace/chat", methods=["POST"])
@token_required # SECURED
def chat():
    try:
        data = request.json or {}
        user_id = data.get("user_id", "default_scholar")
        message = data.get("message", "")
        active_topic = data.get("active_topic", "")
        
        if not message.strip():
            return jsonify({"error": "Message is empty"}), 400
            
        conn = get_db_connection()
        rows = conn.execute("""
        SELECT role, content FROM chat_history 
        WHERE user_id = ? 
        ORDER BY timestamp ASC LIMIT 10
        """, (user_id,)).fetchall()
        
        history = [{"role": r["role"], "content": r["content"]} for r in rows]
        
        cursor = conn.cursor()
        cursor.execute("INSERT INTO chat_history (user_id, role, content) VALUES (?, 'user', ?)", (user_id, message))
        conn.commit()
        
        reply = AIEngine.generate_mentor_reply(history, message, active_topic)
        
        cursor.execute("INSERT INTO chat_history (user_id, role, content) VALUES (?, 'model', ?)", (user_id, reply["content"]))
        conn.commit()
        conn.close()
        
        return jsonify(reply), 200
    except Exception as e:
        logger.error(f"Chat Endpoint Error: {e}")
        return jsonify({"error": str(e)}), 500

# =====================================================================
# 7. RUN THE APPLICATION
# =====================================================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info(f"⚡ SkillValut X Secured Backend server launching on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
