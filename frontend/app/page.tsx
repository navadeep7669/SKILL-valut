"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import RoadmapGraph from "../components/RoadmapGraph";
import ResourceHub from "../components/ResourceHub";
import AITerminal from "../components/AITerminal";

import { 
  Shield, Layout, Cloud, Brain, Database, ArrowRight, Activity, 
  Terminal, Settings, Cpu, ChevronRight, Folder, FolderOpen, 
  FileCode, CheckCircle, Zap, Star, BarChart2, Flame, Lock, Unlock,
  ChevronLeft, ChevronRight as ChevronRightIcon, Target
} from "lucide-react";

// static domain selectors definition
const domains = [
  {
    id: "web development",
    title: "Web Architecture & Engineering",
    description: "Server components, runtime memoization, state containers, and CSS grid layout strategies.",
    icon: Layout,
    accent: "text-cyan-400 border-cyan-500/20 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
  },
  {
    id: "ai/ml",
    title: "Artificial Intelligence & ML",
    description: "Self-attention transformer cores, Lasso regularization, reinforcement reward models, and neural weights.",
    icon: Brain,
    accent: "text-purple-400 border-purple-500/20 bg-purple-950/10 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
  },
  {
    id: "cloud computing",
    title: "Cloud Infrastructure Scale",
    description: "Microservices cluster orchestration, serverless scale, container network nodes, and VPC architectures.",
    icon: Cloud,
    accent: "text-emerald-400 border-emerald-500/20 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
  }
];

export default function SinglePageCoordinator() {
  // ===================================================================
  // 1. STATE & SECURITY CONFIGURATION
  // ===================================================================
  const API_URL = "http://localhost:5000/api";
  const USER_ID = "default_scholar";
  
  // Custom bearer token matching workspace credentials
  // This authenticates our Next.js client tunnel to the Flask API
  const AUTH_TOKEN = "svx_dev_secure_token_2026";

  // Navigation state machine: WELCOME -> QUIZ -> DIAGNOSTICS -> WORKSPACE
  const [view, setView] = useState("WELCOME");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  // Quiz parameters state
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<any>({});

  // Assessment Analysis outcomes state
  const [evaluation, setEvaluation] = useState<any>(null);

  // Roadmap graph parameters state
  const [roadmap, setRoadmap] = useState<any>(null);
  const [activeNode, setActiveNode] = useState<any>(null);

  // AI Mentor Chat states
  const [chatMessages, setChatMessages] = useState([
    { role: "model", content: "System online. Quantum AI Mentor connected. Ready to analyze your skills." }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState("roadmap");

  // ===================================================================
  // 2. SECURE REST API CONNECTIONS (Bearer Tokens Authenticated)
  // ===================================================================
  
  // Helper utility to compile authorized headers automatically
  const getSecureHeaders = () => {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AUTH_TOKEN}`
    };
  };

  // Phase A: Select domain and initiate Flask session (Secure Endpoint)
  const selectDomain = async (domainId: string) => {
    setDomain(domainId);
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        method: "POST",
        headers: getSecureHeaders(),
        body: JSON.stringify({ user_id: USER_ID, domain: domainId })
      });
      
      if (!res.ok) {
        throw new Error(`Session initiation failed with status: ${res.status}`);
      }

      // Automatically request assessment generation on session startup
      const quizRes = await fetch(`${API_URL}/quiz/generate`, {
        method: "POST",
        headers: getSecureHeaders(),
        body: JSON.stringify({ user_id: USER_ID })
      });

      if (!quizRes.ok) {
        throw new Error(`Quiz generation failed with status: ${quizRes.status}`);
      }

      const quizData = await quizRes.json();
      setQuestions(quizData.questions);
      setView("QUIZ");
    } catch (e) {
      console.warn("Backend offline or unauthorized. Triggering offline mock assessment engine.", e);
      // Fallback sample questions
      const mockQs = domainId.includes("ai") ? [
        {
          id: 1,
          topic: "Regularization",
          difficulty: "intermediate",
          question: "What is the primary difference between L1 (Lasso) and L2 (Ridge) regularization?",
          options: [
            "L1 forces weights to zero causing sparsity, L2 shrinks weights toward zero",
            "L2 forces weights to zero, L1 shrinks weights",
            "L1 is classification only, L2 is clustering only",
            "L1 uses absolute values, L2 uses manual clipping boundaries"
          ],
          correct_answer: "L1 forces weights to zero causing sparsity, L2 shrinks weights toward zero"
        },
        {
          id: 2,
          topic: "Transformers",
          difficulty: "advanced",
          question: "Which of the following describes the Self-Attention mathematical equation in Transformers?",
          options: [
            "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V",
            "Attention(Q,K,V) = sigmoid(QK^T) * V",
            "Attention(Q,K,V) = tanh(K^T V) * Q",
            "Attention(Q,K,V) = relu(QV) * K"
          ],
          correct_answer: "Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V"
        }
      ] : [
        {
          id: 1,
          topic: "React Rendering",
          difficulty: "intermediate",
          question: "What describes the difference between Server Components and Client Components in React 18 / Next.js?",
          options: [
            "Server Components render solely on client, Client Components solely on server",
            "Server Components render on server without client JS, Client Components hydrate on client",
            "Server Components cannot fetch database records, Client Components can",
            "There is no difference in runtime execution"
          ],
          correct_answer: "Server Components render on server without client JS, Client Components hydrate on client"
        },
        {
          id: 2,
          topic: "CSS Layout",
          difficulty: "intermediate",
          question: "What is the column layout behavior of `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` when width is 500px?",
          options: [
            "Three columns of 166px are rendered",
            "Two columns of 250px are rendered",
            "One column of 500px is rendered",
            "The grid elements overflow and throw layout bounds"
          ],
          correct_answer: "Two columns of 250px are rendered"
        }
      ];
      setQuestions(mockQs);
      setView("QUIZ");
    } finally {
      setLoading(false);
      setActiveQuestionIndex(0);
      setUserAnswers({});
    }
  };

  // Phase B: Evaluate active quiz responses (Secure Endpoint)
  const submitQuizAnswers = async () => {
    setView("QUIZ_LOADING"); // Show dynamic loading Diagnostics compilation
    
    try {
      const res = await fetch(`${API_URL}/quiz/evaluate`, {
        method: "POST",
        headers: getSecureHeaders(),
        body: JSON.stringify({ user_id: USER_ID, answers: userAnswers })
      });
      
      if (!res.ok) {
        throw new Error(`Evaluation failed with status: ${res.status}`);
      }

      const data = await res.json();
      setEvaluation(data.evaluation);
      setView("DIAGNOSTICS");
    } catch (e) {
      console.warn("Offline or error: scoring user quiz locally.", e);
      await new Promise(r => setTimeout(r, 1200));
      // Local fallback logic
      setEvaluation({
        score: 100,
        strong_concepts: domain.includes("ai") ? ["Transformers"] : ["React Rendering"],
        weak_concepts: domain.includes("ai") ? ["Regularization"] : ["CSS Layout"],
        confidence_rating: "High",
        learning_speed_estimate: "Fast",
        summary: "Excellent aptitude shown! Outstanding technical foundations. Minor updates suggested in relative responsiveness constraints."
      });
      setView("DIAGNOSTICS");
    }
  };

  // Phase C: Generate Roadmap Graph (Secure Endpoint)
  const compileCustomRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/roadmap/generate`, {
        method: "POST",
        headers: getSecureHeaders(),
        body: JSON.stringify({ user_id: USER_ID })
      });
      
      if (!res.ok) {
        throw new Error(`Roadmap generation failed with status: ${res.status}`);
      }

      const data = await res.json();
      setRoadmap(data);
      setActiveNode(data.nodes[0]);
      setView("WORKSPACE");
    } catch (e) {
      console.warn("Offline or error: compiling local roadmap elements.", e);
      await new Promise(r => setTimeout(r, 800));
      // Sample roadmap
      const isAI    = domain.includes("ai");
      const isCloud = domain.includes("cloud");
      const weak    = evaluation?.weak_concepts[0] || "Core Mechanics";

      // Pick domain-specific real resources
      const notesBase = "http://localhost:3000/notes";
      const p1Resources = isAI ? [
        { type: "video", title: "Python for Beginners – freeCodeCamp", url: "https://www.youtube.com/watch?v=rfscVS0vtbw" },
        { type: "video", title: "Machine Learning for Beginners – Microsoft", url: "https://www.youtube.com/watch?v=NWONeJKn6kc" },
        { type: "docs",  title: "Scikit-Learn User Guide", url: "https://scikit-learn.org/stable/user_guide.html" },
        { type: "docs",  title: "Google ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course" },
        { type: "notes", title: "📄 AI/ML Complete Study Guide", url: `${notesBase}/ai-ml.html#p1` },
      ] : isCloud ? [
        { type: "video", title: "Cloud Computing for Beginners – freeCodeCamp", url: "https://www.youtube.com/watch?v=M988_fsOSWo" },
        { type: "video", title: "AWS Certified Cloud Practitioner – Andrew Brown", url: "https://www.youtube.com/watch?v=SOTamWNgDKc" },
        { type: "docs",  title: "AWS Getting Started Guide", url: "https://aws.amazon.com/getting-started/" },
        { type: "docs",  title: "Google Cloud Documentation", url: "https://cloud.google.com/docs" },
        { type: "notes", title: "📄 Cloud Computing Study Guide", url: `${notesBase}/cloud-computing.html#p1` },
      ] : [
        { type: "video", title: "HTML & CSS Full Course – freeCodeCamp", url: "https://www.youtube.com/watch?v=mU6anWqZJcc" },
        { type: "video", title: "JavaScript Crash Course – Traversy Media", url: "https://www.youtube.com/watch?v=hdI2bqOjy3c" },
        { type: "docs",  title: "MDN Web Docs – HTML Reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
        { type: "docs",  title: "MDN Web Docs – CSS Guide", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
        { type: "notes", title: "📄 Web Development Study Guide", url: `${notesBase}/web-development.html#p1` },
      ];

      const p2Resources = isAI ? [
        { type: "video", title: "Neural Networks from Scratch – Andrej Karpathy", url: "https://www.youtube.com/watch?v=VMj-3S1tku0" },
        { type: "video", title: "Deep Learning with PyTorch – freeCodeCamp", url: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
        { type: "docs",  title: "PyTorch Official Tutorials", url: "https://pytorch.org/tutorials/" },
        { type: "notes", title: "📄 AI/ML Deep Learning Phase Guide", url: `${notesBase}/ai-ml.html#p2` },
      ] : isCloud ? [
        { type: "video", title: "Docker & Kubernetes Crash Course – TechWorld with Nana", url: "https://www.youtube.com/watch?v=3c-iBn73dDE" },
        { type: "video", title: "Kubernetes Tutorial – TechWorld with Nana", url: "https://www.youtube.com/watch?v=X48VuDVv0do" },
        { type: "docs",  title: "Docker Official Documentation", url: "https://docs.docker.com/" },
        { type: "notes", title: "📄 Docker & Kubernetes Study Guide", url: `${notesBase}/cloud-computing.html#p2` },
      ] : [
        { type: "video", title: "React JS Full Course 2024 – freeCodeCamp", url: "https://www.youtube.com/watch?v=x4rFhThSX04" },
        { type: "video", title: "Next.js 14 Crash Course – Traversy Media", url: "https://www.youtube.com/watch?v=ZVnjOPwW4ZA" },
        { type: "docs",  title: "React Official Documentation", url: "https://react.dev/" },
        { type: "notes", title: "📄 React & Next.js Phase Guide", url: `${notesBase}/web-development.html#p2` },
      ];

      const p3Resources = isAI ? [
        { type: "video", title: "LLMs from Scratch – Andrej Karpathy", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY" },
        { type: "docs",  title: "HuggingFace Transformers Docs", url: "https://huggingface.co/docs/transformers" },
        { type: "notes", title: "📄 Transformers & LLMs Study Guide", url: `${notesBase}/ai-ml.html#p3` },
      ] : isCloud ? [
        { type: "video", title: "Terraform Crash Course – TechWorld with Nana", url: "https://www.youtube.com/watch?v=l5k1ai_GBDE" },
        { type: "video", title: "CI/CD Pipeline with GitHub Actions", url: "https://www.youtube.com/watch?v=R8_veQiYBjI" },
        { type: "docs",  title: "Terraform Documentation", url: "https://developer.hashicorp.com/terraform/docs" },
        { type: "notes", title: "📄 IaC & CI/CD Study Guide", url: `${notesBase}/cloud-computing.html#p3` },
      ] : [
        { type: "video", title: "REST API Design – Fireship", url: "https://www.youtube.com/watch?v=-MTSQjw5DrM" },
        { type: "video", title: "Full Stack Node + React Project", url: "https://www.youtube.com/watch?v=mrHNSanmqQ4" },
        { type: "docs",  title: "Node.js Official Guide", url: "https://nodejs.org/en/docs/" },
        { type: "notes", title: "📄 Backend & APIs Study Guide", url: `${notesBase}/web-development.html#p3` },
      ];

      const sampleMap = {
        domain: domain,
        nodes: [
          {
            id: "node-1",
            title: isAI ? "ML & Python Foundations" : isCloud ? "Cloud & AWS Fundamentals" : "HTML, CSS & JavaScript",
            description: isAI
              ? "Master Python, NumPy, Pandas, and Scikit-learn to build your first ML pipelines."
              : isCloud
              ? "Understand cloud service models (IaaS/PaaS/SaaS), AWS core services, and IAM."
              : "Build solid foundations in semantic HTML5, CSS Flexbox/Grid, and modern ES6+ JavaScript.",
            estimated_hours: 5,
            phase: "Phase 1: Core Fundamentals",
            status: "unlocked",
            x: 180,
            y: 150,
            resources: p1Resources,
            practice_tasks: [
              "Set up your local development environment",
              "Complete 3 beginner exercises from the official docs",
              "Push your first mini-project to GitHub",
            ],
            mini_project: {
              title: isAI ? "Data Explorer" : isCloud ? "Cloud Setup Lab" : "Responsive Landing Page",
              description: isAI
                ? "Load a dataset with Pandas, visualize it with Matplotlib, and train a simple classifier."
                : isCloud
                ? "Create an AWS free-tier account, launch an EC2 instance, and configure a security group."
                : "Build a fully responsive portfolio page with semantic HTML, CSS Grid layout, and a JS fetch call."
            }
          },
          {
            id: "node-2",
            title: `Deep Dive: ${weak}`,
            description: `Targeted training to close your skill gap in "${weak}" — your diagnostic weak area this session.`,
            estimated_hours: 8,
            phase: "Phase 2: Deep Dive Focus",
            status: "locked",
            x: 420,
            y: 320,
            resources: p2Resources,
            practice_tasks: [
              `Read the official documentation section on ${weak}`,
              `Build a minimal working example demonstrating ${weak}`,
              "Write a short explanation of the concept in your own words",
            ],
            mini_project: {
              title: "Concept Showcase",
              description: `Create a focused mini-app that demonstrates "${weak}" in action with clear code comments explaining each decision.`
            }
          },
          {
            id: "node-3",
            title: isAI ? "MLOps & Production Deployment" : isCloud ? "Microservices & System Design" : "Full-Stack Capstone & Deployment",
            description: isAI
              ? "Deploy ML models as APIs with FastAPI, containerize with Docker, and track experiments with MLflow."
              : isCloud
              ? "Design scalable microservice architectures, implement service mesh, and apply observability patterns."
              : "Build and ship a complete full-stack application with CI/CD, environment config, and a live URL.",
            estimated_hours: 12,
            phase: "Phase 3: Applied Architecture",
            status: "locked",
            x: 750,
            y: 200,
            resources: p3Resources,
            practice_tasks: [
              "Deploy your project to a live URL",
              "Add a CI/CD pipeline for automatic deployments",
              "Write a README documenting your architecture decisions",
            ],
            mini_project: {
              title: "Live Production App",
              description: "Build and ship a full-stack application that solves a real problem — with a live URL, proper error handling, and clean documentation."
            }
          }
        ],
        connections: [
          { from: "node-1", to: "node-2" },
          { from: "node-2", to: "node-3" }
        ]
      };
      setRoadmap(sampleMap);
      setActiveNode(sampleMap.nodes[0]);
      setView("WORKSPACE");
    } finally {
      setLoading(false);
    }
  };

  // Phase D: Toggles a Node's completed status, recalculates locks (Secure Endpoint)
  const toggleNodeCompletion = async (nodeId: string, completed: boolean) => {
    try {
      const res = await fetch(`${API_URL}/roadmap/node/toggle`, {
        method: "POST",
        headers: getSecureHeaders(),
        body: JSON.stringify({ user_id: USER_ID, node_id: nodeId, completed })
      });

      if (!res.ok) {
        throw new Error(`Toggle failed with status: ${res.status}`);
      }

      const data = await res.json();
      setRoadmap(data);
      const updatedNode = data.nodes.find((n: any) => n.id === nodeId);
      if (activeNode?.id === nodeId) {
        setActiveNode(updatedNode);
      }
    } catch (e) {
      console.warn("Offline or error: Toggling node status locally.", e);
      if (!roadmap) return;
      
      const nextNodes = roadmap.nodes.map((n: any) => {
        if (n.id === nodeId) {
          return { ...n, status: completed ? "completed" : "unlocked" };
        }
        return n;
      });
      
      // Basic client side unlocking dependency chain
      const completedSet = new Set(
        nextNodes.filter((n: any) => n.status === "completed").map((n: any) => n.id)
      );
      
      const finishedNodes = nextNodes.map((n: any) => {
        if (n.status === "completed") return n;
        if (n.id === "node-2" && completedSet.has("node-1")) {
          return { ...n, status: "unlocked" };
        }
        if (n.id === "node-3" && completedSet.has("node-2")) {
          return { ...n, status: "unlocked" };
        }
        return n;
      });
      
      const nextRoadmap = { ...roadmap, nodes: finishedNodes };
      setRoadmap(nextRoadmap);
      const nextActiveNode = finishedNodes.find((n: any) => n.id === activeNode?.id) || null;
      setActiveNode(nextActiveNode);
    }
  };

  // Phase E: AI Mentor Chat dialogue submission (Secure Endpoint)
  const sendChatMessage = async (msgString: string) => {
    if (!msgString.trim()) return;
    
    // Add user message to state instantly
    const userMsg = { role: "user", content: msgString };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/workspace/chat`, {
        method: "POST",
        headers: getSecureHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          message: msgString,
          active_topic: activeNode?.title || ""
        })
      });

      if (!res.ok) {
        throw new Error(`Chat failed with status: ${res.status}`);
      }

      const data = await res.json();
      setChatMessages([...updatedMessages, { role: "model", content: data.content }]);
    } catch (e) {
      console.warn("Offline or error: Generating chat mentor reply locally.", e);
      await new Promise(r => setTimeout(r, 600));
      const mockReply = `Regarding your query about "${msgString}", here is an easy-to-understand student pattern.

Make sure to split your logic into simple modular functions:
\`\`\`javascript
// Simplified function block
function calculateProgress(completedCount, totalCount) {
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}
\`\`\`
Let me know if you want me to help write more code templates!`;
      setChatMessages([...updatedMessages, { role: "model", content: mockReply }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleExit = () => {
    setView("WELCOME");
    setDomain("");
    setQuestions([]);
    setEvaluation(null);
    setRoadmap(null);
    setActiveNode(null);
    setChatMessages([
      { role: "model", content: "System online. Quantum AI Mentor connected. Ready to analyze your skills." }
    ]);
  };

  // ===================================================================
  // 3. RENDER VIEWS
  // ===================================================================
  
  return (
    <div className="min-h-screen text-gray-200 bg-[#030611] font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden flex flex-col">
      
      {/* VIEW A: LANDING SCREEN */}
      {view === "WELCOME" && (
        <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 text-center select-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-600/10 to-indigo-600/10 blur-[120px] pointer-events-none"></div>
          
          {/* Logo Orb */}
          <div className="w-20 h-20 rounded-full bg-[#04091a] border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)] ring-4 ring-cyan-500/10 mb-8 animate-pulse">
            <Terminal className="w-9 h-9 text-cyan-400" />
          </div>

          <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 tracking-tight leading-none mb-4 uppercase">
            SkillValut X
          </h1>
          <p className="font-mono text-xs sm:text-sm text-gray-400 tracking-widest uppercase mb-12 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AI Learning operating system for beginners</span>
          </p>

          <div className="w-full max-w-2xl bg-indigo-950/10 border border-indigo-500/10 rounded-xl p-5 mb-10 text-center backdrop-blur-md">
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              Welcome, Student! Choose a domain to boot your diagnostic assessment. We will evaluate your weak topics using Gemini AI (or local sample codes) and immediately compile a glowing custom coordinate Roadmap graph inside a futuristic mock editor.
            </p>
          </div>

          {/* Domain options selectors */}
          <div className="w-full max-w-4xl grid gap-4 sm:grid-cols-2 md:grid-cols-3 justify-center mb-8">
            {domains.map((dom) => {
              const Icon = dom.icon;
              return (
                <button
                  key={dom.id}
                  onClick={() => !loading && selectDomain(dom.id)}
                  disabled={loading}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-[180px] transition-all duration-300 group cursor-pointer ${dom.accent}`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-[#030611]/80 border border-gray-800 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-gray-300 group-hover:scale-105 transition-transform" />
                    </div>
                    <h3 className="font-orbitron font-extrabold text-xs tracking-wider uppercase text-gray-100">
                      {dom.title}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal mt-2">
                    {dom.description}
                  </p>
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center gap-3 mt-4 text-xs text-cyan-400 font-mono">
              <span className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></span>
              <span>COMPILING DYNAMIC ASSESSMENT QUESTIONS MATRIX...</span>
            </div>
          )}
        </main>
      )}

      {/* VIEW B: ACTIVE ASSESSMENT MCQ */}
      {view === "QUIZ" && questions.length > 0 && (
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#070b19]/90 border border-[#1f2937]/50 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Header Telemetries */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                  Assessment: {domain}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-cyan-400 font-bold">{activeQuestionIndex + 1}</span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-500">{questions.length}</span>
              </div>
            </div>

            {/* Question Box */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 text-[9px] font-mono text-cyan-400 uppercase tracking-wider">
                  Topic: {questions[activeQuestionIndex].topic}
                </span>
              </div>

              <h2 className="font-sans text-gray-100 font-bold leading-snug text-base md:text-lg select-text">
                {questions[activeQuestionIndex].question.includes("```") ? (
                  <div className="space-y-3 whitespace-pre-wrap select-text">
                    <p>{questions[activeQuestionIndex].question.split("```")[0]}</p>
                    <pre className="p-3 bg-[#030611] border border-[#1f2937]/40 rounded-lg text-indigo-200 text-xs font-mono select-text">
                      {questions[activeQuestionIndex].question.split("```")[1]?.replace(/^\w+/, "").trim()}
                    </pre>
                  </div>
                ) : (
                  questions[activeQuestionIndex].question
                )}
              </h2>
            </div>

            {/* MCQ Options grid list */}
            <div className="grid gap-3 select-none">
              {questions[activeQuestionIndex].options.map((opt: any, idx: number) => {
                const isSelected = userAnswers[questions[activeQuestionIndex].id.toString()] === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserAnswers({
                        ...userAnswers,
                        [questions[activeQuestionIndex].id.toString()]: opt
                      });
                    }}
                    className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/15 border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                        : "bg-[#030611]/70 border-[#1f2937]/50 text-gray-300 hover:text-white hover:border-cyan-500/30"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-cyan-400 bg-cyan-950" : "border-gray-700"
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer buttons */}
            <div className="flex justify-between items-center border-t border-gray-800 pt-5">
              <button
                onClick={() => setActiveQuestionIndex(Math.max(activeQuestionIndex - 1, 0))}
                disabled={activeQuestionIndex === 0}
                className="px-3.5 py-2 border border-gray-800 hover:border-cyan-500/30 text-gray-400 hover:text-gray-200 disabled:opacity-30 rounded-lg flex items-center gap-1 text-xs font-mono cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {activeQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={submitQuizAnswers}
                  disabled={!userAnswers[questions[activeQuestionIndex].id.toString()]}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white disabled:opacity-50 rounded-lg flex items-center gap-1.5 text-xs font-mono font-bold shadow-lg border border-cyan-400/20 cursor-pointer"
                >
                  <span>Submit Quiz</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveQuestionIndex(Math.min(activeQuestionIndex + 1, questions.length - 1))}
                  disabled={!userAnswers[questions[activeQuestionIndex].id.toString()]}
                  className="px-4 py-2 bg-[#040c1a] border border-[#1f2937] hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 rounded-lg flex items-center gap-1 text-xs font-mono cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </main>
      )}

      {/* VIEW C: DIAGNOSTIC LOADING DELAY */}
      {view === "QUIZ_LOADING" && (
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[#070b19]/90 border border-[#1f2937]/50 rounded-2xl p-8 shadow-2xl text-center space-y-5 font-mono text-cyan-400">
            <Cpu className="w-14 h-14 text-cyan-400 animate-spin mx-auto" />
            <h2 className="text-sm font-bold uppercase tracking-widest animate-pulse">
              Running Diagnostic Evaluation Core
            </h2>
            <div className="max-w-md mx-auto bg-gray-950 border border-gray-900 p-4 rounded-xl text-[11px] text-gray-500 text-left space-y-1.5 leading-relaxed uppercase">
              <p>➔ Analyzing Concept-wise accuracy weights...</p>
              <p>➔ Parsing dynamic speed profiles...</p>
              <p>➔ Setting up coordinate roadmap curves...</p>
            </div>
          </div>
        </main>
      )}

      {/* VIEW D: ASSESSMENT ANALYTICS COMPILATIONS */}
      {view === "DIAGNOSTICS" && evaluation && (
        <main className="flex-1 flex items-center justify-center p-4 select-text">
          <div className="w-full max-w-2xl bg-[#070b19]/90 border border-[#1f2937]/50 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            <div className="text-center space-y-1 pb-5 border-b border-gray-800">
              <h2 className="font-orbitron font-extrabold text-lg tracking-widest text-cyan-400 uppercase">
                Assessment Diagnostics Compiled
              </h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Telemetry stats profile generated via AI
              </p>
            </div>

            {/* Metrics cards row */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-4 bg-[#030611] border border-gray-800/80 rounded-xl text-center space-y-1">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Score</span>
                <span className="font-orbitron font-black text-2xl text-cyan-400 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-cyan-400" /> {evaluation.score}%
                </span>
              </div>
              <div className="p-4 bg-[#030611] border border-gray-800/80 rounded-xl text-center space-y-1">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Confidence</span>
                <span className="font-orbitron font-black text-xs md:text-sm uppercase tracking-wider text-indigo-400 flex items-center justify-center h-8 gap-1">
                  <BarChart2 className="w-4 h-4 text-indigo-400" /> {evaluation.confidence_rating}
                </span>
              </div>
              <div className="p-4 bg-[#030611] border border-gray-800/80 rounded-xl text-center space-y-1">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Velocity</span>
                <span className="font-orbitron font-black text-xs md:text-sm uppercase tracking-wider text-emerald-400 flex items-center justify-center h-8 gap-1">
                  <Flame className="w-4 h-4 text-emerald-400 animate-pulse" /> {evaluation.learning_speed_estimate}
                </span>
              </div>
            </div>

            {/* summary details box */}
            <div className="p-4 bg-[#030611]/80 border border-[#1f2937]/50 rounded-xl space-y-1">
              <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Summary Profile
              </h4>
              <p className="text-xs leading-relaxed text-gray-300 font-sans">
                {evaluation.summary}
              </p>
            </div>

            {/* Strengths / Weaknesses cards */}
            <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-red-950/5 border border-red-500/10 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  ⚠️ Weaknesses (Focused Targets)
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {evaluation.weak_concepts.map((concept: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-950/20 border border-red-500/20 text-[10px] text-red-300">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-emerald-950/5 border border-emerald-500/10 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  ✓ Strengths (Validated Competencies)
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {evaluation.strong_concepts.map((concept: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-[10px] text-emerald-300">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action drawer button */}
            <div className="border-t border-gray-800 pt-5 text-center">
              <button
                onClick={compileCustomRoadmap}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-orbitron font-extrabold text-xs tracking-widest uppercase shadow-lg border border-cyan-400/20 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                    <span>Compiling Neural Graph Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Personalized Workspace</span>
                    <ChevronRightIcon className="w-4 h-4 text-cyan-300" />
                  </>
                )}
              </button>
            </div>

          </div>
        </main>
      )}

      {/* VIEW E: FUTURISTIC WORKSPACE GRAPH CONSOLE */}
      {view === "WORKSPACE" && roadmap && (
        <div className="h-screen w-screen flex flex-col overflow-hidden">
          {/* Top telemetry status bar */}
          <header className="h-11 bg-[#030712] border-b border-[#1f2937]/50 flex items-center justify-between px-4 shrink-0 font-mono text-xs z-20 select-none">
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-extrabold text-cyan-400 tracking-wider">SKILLVALUT X</span>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>telemetry_sync: v2.5.4</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-cyan-950/20 border border-cyan-500/20 text-cyan-400 rounded-full font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Domain: {domain}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-gray-500">
                <Settings className="w-4 h-4 animate-spin [animation-duration:10s]" />
              </div>
            </div>
          </header>

          {/* Main workspace UI area */}
          <div className="flex-1 flex overflow-hidden w-full relative">
            
            {/* Left Nav sidebar */}
            <Sidebar 
              activeTab={workspaceTab} 
              setActiveTab={setWorkspaceTab} 
              onExit={handleExit} 
            />

            {/* Folder Explorer Sidebar layout (VS Code inspired) */}
            <div className="w-64 bg-[#050915] border-r border-[#1f2937]/40 h-full flex flex-col shrink-0">
              <div className="p-3 border-b border-[#1f2937]/40 flex items-center justify-between font-mono text-[10px] tracking-wider text-gray-400 uppercase select-none">
                <span>Folder Explorer</span>
                <FolderOpen className="w-3.5 h-3.5 text-cyan-500/80" />
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-4 font-mono text-xs select-none">
                
                {/* Folder A: Fundamentals */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 px-1.5 py-1">
                    <Folder className="w-4 h-4" />
                    <span className="font-bold tracking-wide uppercase text-[9px]">Fundamentals</span>
                  </div>
                  <div className="pl-3 space-y-0.5">
                    {roadmap.nodes
                      .filter((n: any) => n.phase.includes("Phase 1"))
                      .map((node: any) => (
                        <button
                          key={node.id}
                          onClick={() => setActiveNode(node)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left truncate cursor-pointer ${
                            activeNode?.id === node.id
                              ? "bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 font-bold"
                              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/10"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FileCode className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{node.title}</span>
                          </div>
                          {node.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Folder B: Focus targets */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 px-1.5 py-1">
                    <Folder className="w-4 h-4" />
                    <span className="font-bold tracking-wide uppercase text-[9px]">Deep Dives (Weak Topics)</span>
                  </div>
                  <div className="pl-3 space-y-0.5">
                    {roadmap.nodes
                      .filter((n: any) => n.phase.includes("Phase 2"))
                      .map((node: any) => {
                        const isLocked = node.status === "locked";
                        return (
                          <button
                            key={node.id}
                            disabled={isLocked}
                            onClick={() => setActiveNode(node)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left truncate ${
                              isLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                            } ${
                              activeNode?.id === node.id
                                ? "bg-cyan-950/40 text-cyan-300 border-l-2 border-cyan-500 font-bold"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/10"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FileCode className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{node.title}</span>
                            </div>
                            {node.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Folder C: Applied Projects */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 px-1.5 py-1">
                    <Folder className="w-4 h-4" />
                    <span className="font-bold tracking-wide uppercase text-[9px]">Applied Caps</span>
                  </div>
                  <div className="pl-3 space-y-0.5">
                    {roadmap.nodes
                      .filter((n: any) => n.phase.includes("Phase 3"))
                      .map((node: any) => {
                        const isLocked = node.status === "locked";
                        return (
                          <button
                            key={node.id}
                            disabled={isLocked}
                            onClick={() => setActiveNode(node)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left truncate ${
                              isLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                            } ${
                              activeNode?.id === node.id
                                ? "bg-purple-950/40 text-purple-300 border-l-2 border-purple-500 font-bold"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/10"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FileCode className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{node.title}</span>
                            </div>
                            {node.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                  </div>
                </div>

              </div>
            </div>

            {/* Central Work Content screen */}
            <main className="flex-1 h-full p-4 flex flex-col min-w-0">
              
              {/* Active navigation tags */}
              <div className="flex items-center gap-2 mb-3 shrink-0 select-none font-mono text-[10px]">
                <span className="text-gray-500 uppercase">Workspace:</span>
                <ChevronRight className="w-3 h-3 text-gray-600" />
                <div className="px-2.5 py-1 bg-[#050816] border border-gray-800 rounded text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{workspaceTab === "roadmap" ? "SVG Connected skill-map Graph" : workspaceTab.toUpperCase()}</span>
                </div>
              </div>

              {/* swap visual panels */}
              <div className="flex-1 min-h-0 relative">
                {workspaceTab === "roadmap" && (
                  <RoadmapGraph 
                    roadmapData={roadmap} 
                    activeNode={activeNode} 
                    selectNode={setActiveNode} 
                    toggleNodeCompletion={toggleNodeCompletion}
                  />
                )}
                {workspaceTab === "explorer" && (
                  <div className="h-full flex flex-col justify-center items-center bg-[#070b19]/80 border border-gray-800 rounded-2xl p-6 font-mono text-center select-none">
                    <FolderOpen className="w-12 h-12 text-cyan-400 mb-3 animate-pulse" />
                    <h4 className="text-gray-300 font-bold mb-1">Explorer Console Mode</h4>
                    <p className="text-xs text-gray-500 max-w-sm">Use the left directory file folder tree list to browse through conceptual details and practice project specs.</p>
                  </div>
                )}
                {workspaceTab === "resources" && (
                  <ResourceHub 
                    activeNode={activeNode} 
                    toggleNodeCompletion={toggleNodeCompletion} 
                  />
                )}
                {workspaceTab === "terminal" && (
                  <AITerminal 
                    chatMessages={chatMessages} 
                    onSendMessage={sendChatMessage} 
                    isChatLoading={isChatLoading} 
                    activeNode={activeNode}
                  />
                )}
              </div>
            </main>

            {/* Right side floating split AI mentor drawer */}
            {workspaceTab !== "terminal" && (
              <aside className="w-80 h-full p-4 pl-0 shrink-0 flex flex-col">
                <AITerminal 
                  chatMessages={chatMessages} 
                  onSendMessage={sendChatMessage} 
                  isChatLoading={isChatLoading} 
                  activeNode={activeNode}
                />
              </aside>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
