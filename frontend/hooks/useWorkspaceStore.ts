import { create } from "zustand";

export interface ResourceItem {
  type: "video" | "docs" | "interactive" | "article";
  title: string;
  url: string;
}

export interface MiniProject {
  title: string;
  description: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  estimated_hours: number;
  phase: string;
  status: "locked" | "unlocked" | "in_progress" | "completed";
  resources: ResourceItem[];
  practice_tasks: string[];
  mini_project?: MiniProject;
  x: number;
  y: number;
}

export interface RoadmapConnection {
  from: string;
  to: string;
}

export interface RoadmapData {
  domain: string;
  nodes: RoadmapNode[];
  connections: RoadmapConnection[];
  completed_list?: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  topic: string;
}

export interface EvaluationResult {
  score: number;
  weak_concepts: string[];
  strong_concepts: string[];
  confidence_rating: string;
  learning_speed_estimate: string;
  summary: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface WorkspaceState {
  // Session API URL
  apiBaseUrl: string;
  
  // User Session
  userId: string;
  domain: string;
  isSessionActive: boolean;
  
  // Quiz states
  quizPhase: "not_started" | "active" | "analyzing" | "completed";
  quizQuestions: QuizQuestion[];
  userAnswers: Record<string, string>;
  activeQuestionIndex: number;
  evaluationResult: EvaluationResult | null;
  
  // Roadmap states
  roadmapData: RoadmapData | null;
  activeNode: RoadmapNode | null;
  isLoadingRoadmap: boolean;
  
  // Chat States
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  
  // UI Panels
  activeTab: "explorer" | "roadmap" | "terminal" | "resources";
  
  // Actions
  initializeSession: (domain: string) => Promise<void>;
  generateQuiz: () => Promise<void>;
  submitAnswer: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  evaluateQuiz: () => Promise<void>;
  fetchRoadmap: () => Promise<void>;
  generateRoadmap: () => Promise<void>;
  toggleNodeCompletion: (nodeId: string, completed: boolean) => Promise<void>;
  selectNode: (node: RoadmapNode | null) => void;
  sendChatMessage: (message: string) => Promise<void>;
  clearSession: () => void;
  setActiveTab: (tab: "explorer" | "roadmap" | "terminal" | "resources") => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  apiBaseUrl: "http://localhost:5000/api",
  userId: "default_scholar",
  domain: "",
  isSessionActive: false,
  
  quizPhase: "not_started",
  quizQuestions: [],
  userAnswers: {},
  activeQuestionIndex: 0,
  evaluationResult: null,
  
  roadmapData: null,
  activeNode: null,
  isLoadingRoadmap: false,
  
  chatMessages: [
    {
      role: "model",
      content: "System online. Quantum AI Mentor connected. Ready to analyze your skills."
    }
  ],
  isChatLoading: false,
  
  activeTab: "roadmap",

  setActiveTab: (tab) => set({ activeTab: tab }),

  initializeSession: async (domain) => {
    const { apiBaseUrl, userId } = get();
    try {
      const res = await fetch(`${apiBaseUrl}/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, domain })
      });
      const data = await res.json();
      
      if (res.ok) {
        set({
          domain: data.domain,
          isSessionActive: true,
          quizPhase: "not_started",
          quizQuestions: [],
          userAnswers: {},
          activeQuestionIndex: 0,
          evaluationResult: null,
          roadmapData: null,
          activeNode: null,
          chatMessages: [
            {
              role: "model",
              content: `Quantum AI Mentor loaded for ${domain.toUpperCase()} domain. Accessing central knowledge grids...`
            }
          ]
        });
      } else {
        console.error("Session initialization failed:", data.error);
      }
    } catch (e) {
      // Fallback local support if backend offline
      console.warn("Backend offline, loading mock session.");
      set({
        domain,
        isSessionActive: true,
        quizPhase: "not_started"
      });
    }
  },

  generateQuiz: async () => {
    const { apiBaseUrl, userId } = get();
    set({ quizPhase: "active", activeQuestionIndex: 0, userAnswers: {} });
    
    try {
      const res = await fetch(`${apiBaseUrl}/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      
      if (res.ok) {
        set({ quizQuestions: data.questions });
      }
    } catch (e) {
      console.warn("Generating mock quiz...");
      // Simulate quick response from mock engine directly in client if backend down
      const mockQuestions = get().domain.includes("ai") ? [
        {
          id: 1,
          topic: "Regularization",
          difficulty: "intermediate" as const,
          question: "What is the primary difference between L1 and L2 regularization?",
          options: [
            "L1 forces weights to zero causing sparsity, L2 shrinks weights toward zero",
            "L2 forces weights to zero, L1 shrinks weights",
            "L1 is classification only, L2 is clustering only",
            "L1 uses quadratic penalty, L2 uses absolute values"
          ],
          correct_answer: "L1 forces weights to zero causing sparsity, L2 shrinks weights toward zero"
        },
        {
          id: 2,
          topic: "Transformers",
          difficulty: "advanced" as const,
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
          difficulty: "intermediate" as const,
          question: "What describes the difference between Server Components and Client Components in Next.js?",
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
          difficulty: "intermediate" as const,
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
      set({ quizQuestions: mockQuestions });
    }
  },

  submitAnswer: (questionId, answer) => {
    set((state) => ({
      userAnswers: { ...state.userAnswers, [questionId.toString()]: answer }
    }));
  },

  nextQuestion: () => {
    set((state) => ({
      activeQuestionIndex: Math.min(state.activeQuestionIndex + 1, state.quizQuestions.length - 1)
    }));
  },

  prevQuestion: () => {
    set((state) => ({
      activeQuestionIndex: Math.max(state.activeQuestionIndex - 1, 0)
    }));
  },

  evaluateQuiz: async () => {
    const { apiBaseUrl, userId, userAnswers } = get();
    set({ quizPhase: "analyzing" });
    
    try {
      const res = await fetch(`${apiBaseUrl}/quiz/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, answers: userAnswers })
      });
      const data = await res.json();
      
      if (res.ok) {
        set({
          evaluationResult: data.evaluation,
          quizPhase: "completed"
        });
      }
    } catch (e) {
      console.warn("Performing local mock analysis...");
      // Simulate delayed loader
      await new Promise(r => setTimeout(r, 1500));
      set({
        quizPhase: "completed",
        evaluationResult: {
          score: 100,
          strong_concepts: get().domain.includes("ai") ? ["Transformers"] : ["React Rendering"],
          weak_concepts: get().domain.includes("ai") ? ["Regularization"] : ["CSS Layout"],
          confidence_rating: "high",
          learning_speed_estimate: "fast",
          summary: "Outstanding logic demonstrated! Solid grasp of complex runtime environments. Minor improvements needed in relative structural styling constraints."
        }
      });
    }
  },

  generateRoadmap: async () => {
    const { apiBaseUrl, userId } = get();
    set({ isLoadingRoadmap: true });
    
    try {
      const res = await fetch(`${apiBaseUrl}/roadmap/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      
      if (res.ok) {
        set({
          roadmapData: data,
          activeNode: data.nodes[0] || null,
          isLoadingRoadmap: false,
          activeTab: "roadmap"
        });
      }
    } catch (e) {
      console.warn("Generating mock roadmap...");
      await new Promise(r => setTimeout(r, 1200));
      
      const isAI = get().domain.includes("ai");
      const weak = get().evaluationResult?.weak_concepts[0] || "Core Concepts";
      
      const mockRoadmap: RoadmapData = {
        domain: get().domain,
        nodes: [
          {
            id: "node-1",
            title: isAI ? "Machine Learning Core" : "Modern JS & Components",
            description: "Understand state grids, data trees, and runtime execution loops.",
            estimated_hours: 6,
            phase: "Phase 1: Core Fundamentals",
            status: "unlocked",
            x: 180,
            y: 150,
            resources: [
              { type: "video", title: "RSC Crash Course by Traversy Media", url: "https://www.youtube.com/results?search_query=Next+js+App+Router" },
              { type: "docs", title: "Official Documentation Guide", url: "https://nextjs.org" }
            ],
            practice_tasks: ["Build static layout frames resolving hydration structures."],
            mini_project: {
              title: "Digital Portfolio Frame",
              description: "Create a fully functional portfolio site using static rendering configurations."
            }
          },
          {
            id: "node-2",
            title: `Weakness Target: ${weak}`,
            description: "Intense core dive covering identified weakness domains.",
            estimated_hours: 10,
            phase: "Phase 2: Deep Dive Focus",
            status: "locked",
            x: 420,
            y: 320,
            resources: [
              { type: "video", title: `Understanding ${weak} inside out`, url: "https://youtube.com" },
              { type: "docs", title: `${weak} Core Specifications`, url: "https://google.com" }
            ],
            practice_tasks: ["Create custom sandbox code implementing these mechanisms."],
            mini_project: {
              title: "HUD Glassmorphic Console",
              description: "Build a neon styled interactive controller layout resolving grid parameters."
            }
          },
          {
            id: "node-3",
            title: "Applied Capsular Production",
            description: "Integrate APIs, state pipelines, and security controls.",
            estimated_hours: 15,
            phase: "Phase 3: Applied Architecture",
            status: "locked",
            x: 750,
            y: 200,
            resources: [
              { type: "video", title: "Enterprise Scaling Masterclass", url: "https://youtube.com" }
            ],
            practice_tasks: ["Deploy a full-stack integrated API using state caches."],
              mini_project: {
              title: "SkillValut X Operating Console",
              description: "Merge layouts, databases, and AI modules into a single production-ready dashboard."
            }
          }
        ],
        connections: [
          { from: "node-1", to: "node-2" },
          { from: "node-2", to: "node-3" }
        ]
      };
      
      set({
        roadmapData: mockRoadmap,
        activeNode: mockRoadmap.nodes[0],
        isLoadingRoadmap: false,
        activeTab: "roadmap"
      });
    }
  },

  fetchRoadmap: async () => {
    const { apiBaseUrl, userId } = get();
    set({ isLoadingRoadmap: true });
    
    try {
      const res = await fetch(`${apiBaseUrl}/roadmap/latest?user_id=${userId}`);
      const data = await res.json();
      
      if (res.ok) {
        set({
          roadmapData: data,
          activeNode: get().activeNode || data.nodes[0] || null,
          isLoadingRoadmap: false
        });
      } else {
        set({ isLoadingRoadmap: false });
      }
    } catch (e) {
      console.warn("Local fetch roadmap failed. Store remains unchanged.");
      set({ isLoadingRoadmap: false });
    }
  },

  toggleNodeCompletion: async (nodeId, completed) => {
    const { apiBaseUrl, userId } = get();
    try {
      const res = await fetch(`${apiBaseUrl}/roadmap/node/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, node_id: nodeId, completed })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Find updated active node in list
        const updatedNode = data.nodes.find((n: RoadmapNode) => n.id === nodeId);
        set((state) => ({
          roadmapData: data,
          activeNode: state.activeNode?.id === nodeId ? updatedNode : state.activeNode
        }));
      }
    } catch (e) {
      // Offline fallback toggle
      console.warn("Offline: Toggling node state locally.");
      const currentRoadmap = get().roadmapData;
      if (!currentRoadmap) return;
      
      const updatedNodes = currentRoadmap.nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, status: (completed ? "completed" as const : "unlocked" as const) };
        }
        return n;
      });
      
      // Basic dependency unlocking logic local mockup
      const completedIds = new Set(
        updatedNodes.filter(n => n.status === "completed").map(n => n.id)
      );
      
      const finishedNodes = updatedNodes.map((n) => {
        if (n.status === "completed") return n;
        // Node 2 unlocked if node 1 completed
        if (n.id === "node-2" && completedIds.has("node-1")) {
          return { ...n, status: "unlocked" as const };
        }
        // Node 3 unlocked if node 2 completed
        if (n.id === "node-3" && completedIds.has("node-2")) {
          return { ...n, status: "unlocked" as const };
        }
        return n;
      });
      
      const nextRoadmap = { ...currentRoadmap, nodes: finishedNodes };
      const nextActiveNode = finishedNodes.find(n => n.id === get().activeNode?.id) || null;
      
      set({
        roadmapData: nextRoadmap,
        activeNode: nextActiveNode
      });
    }
  },

  selectNode: (node) => set({ activeNode: node }),

  sendChatMessage: async (message) => {
    const { apiBaseUrl, userId, activeNode } = get();
    if (!message.trim()) return;
    
    // Add user message immediately
    set((state) => ({
      chatMessages: [...state.chatMessages, { role: "user", content: message }],
      isChatLoading: true
    }));
    
    try {
      const res = await fetch(`${apiBaseUrl}/workspace/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message,
          active_topic: activeNode?.title || ""
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        set((state) => ({
          chatMessages: [...state.chatMessages, { role: "model", content: data.content }],
          isChatLoading: false
        }));
      }
    } catch (e) {
      // Mock chat mentor local reply
      await new Promise(r => setTimeout(r, 800));
      let replyContent = `Regarding your query about "${message}", let's break down how we can structure this effectively:

### 💡 Mentorship Guidance
1. **Unidirectional Flow**: Maintain clean encapsulation in components.
2. **Handle States Gracefully**: Write tests for exceptions.

Here is a clean snippet matching your request:
\`\`\`typescript
export const getActiveNodeDetails = (id: string) => {
  return fetch(\`/api/roadmap/node/\${id}\`)
    .then(r => r.json())
    .catch(err => console.error("HUD telemetry offline:", err));
};
\`\`\`
Let me know if you would like me to detail further concept modules!`;
      
      set((state) => ({
        chatMessages: [...state.chatMessages, { role: "model", content: replyContent }],
        isChatLoading: false
      }));
    }
  },

  clearSession: () => {
    set({
      domain: "",
      isSessionActive: false,
      quizPhase: "not_started",
      quizQuestions: [],
      userAnswers: {},
      activeQuestionIndex: 0,
      evaluationResult: null,
      roadmapData: null,
      activeNode: null,
      chatMessages: [
        {
          role: "model",
          content: "System online. Quantum AI Mentor connected. Ready to analyze your skills."
        }
      ]
    });
  }
}));
