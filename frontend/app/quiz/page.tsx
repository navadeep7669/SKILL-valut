"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "../../hooks/useWorkspaceStore";
import { Cpu, CheckCircle2, ChevronRight, ChevronLeft, Target, Star, BarChart2, Flame } from "lucide-react";

export default function QuizPage() {
  const router = useRouter();
  const {
    domain,
    isSessionActive,
    quizQuestions,
    generateQuiz,
    userAnswers,
    submitAnswer,
    activeQuestionIndex,
    nextQuestion,
    prevQuestion,
    quizPhase,
    evaluateQuiz,
    evaluationResult,
    generateRoadmap
  } = useWorkspaceStore();

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // If user arrived here without choosing domain, redirect to landing
    if (!isSessionActive) {
      router.push("/");
      return;
    }
    // Generate the assessment
    generateQuiz();
  }, [isSessionActive]);

  // Sync selected answer when question changes
  useEffect(() => {
    if (quizQuestions.length > 0) {
      const activeQ = quizQuestions[activeQuestionIndex];
      const savedAns = userAnswers[activeQ.id.toString()] || "";
      setSelectedOption(savedAns);
    }
  }, [activeQuestionIndex, quizQuestions, userAnswers]);

  const handleSelectOption = (opt: string) => {
    setSelectedOption(opt);
    const activeQ = quizQuestions[activeQuestionIndex];
    submitAnswer(activeQ.id, opt);
  };

  const handleFinishQuiz = async () => {
    await evaluateQuiz();
  };

  const handleGenerateRoadmap = async () => {
    setIsRedirecting(true);
    await generateRoadmap();
    router.push("/workspace");
  };

  if (quizQuestions.length === 0 && quizPhase === "active") {
    return (
      <div className="min-h-screen bg-[#030611] flex flex-col items-center justify-center font-mono text-cyan-400">
        <Cpu className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <span>COMPILING DYNAMIC ASSESSMENT QUESTIONS...</span>
      </div>
    );
  }

  const activeQuestion = quizQuestions[activeQuestionIndex];
  const totalQuestions = quizQuestions.length;

  return (
    <main className="min-h-screen bg-[#030611] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-600/5 to-cyan-600/5 blur-[120px] pointer-events-none select-none"></div>

      <div className="w-full max-w-2xl z-10">
        {/* PHASE 1: ACTIVE QUIZ */}
        {quizPhase === "active" && activeQuestion && (
          <div className="bg-[#070b19]/90 border border-[#1f2937]/50 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Header Telemetries */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                  Assessment: {domain}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-cyan-400">
                  {activeQuestionIndex + 1}
                </span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-500">{totalQuestions}</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="space-y-4">
              {/* Topic & Difficulty tier */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 text-[9px] font-mono text-cyan-400 uppercase tracking-wider">
                  Concept: {activeQuestion.topic}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/30 text-[9px] font-mono text-indigo-400 uppercase tracking-wider">
                  Diff: {activeQuestion.difficulty}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="font-sans text-gray-100 font-bold leading-snug text-base md:text-lg select-text">
                {activeQuestion.question.includes("```") ? (
                  // Simple snippet split render
                  <div className="space-y-3 whitespace-pre-wrap select-text">
                    <p>{activeQuestion.question.split("```")[0]}</p>
                    <pre className="p-3 bg-[#030611] border border-[#1f2937]/40 rounded-lg text-indigo-200 text-xs font-mono select-text">
                      {activeQuestion.question.split("```")[1]?.replace(/^\w+/, "").trim()}
                    </pre>
                  </div>
                ) : (
                  activeQuestion.question
                )}
              </h2>
            </div>

            {/* Options List */}
            <div className="grid gap-3 select-none">
              {activeQuestion.options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-cyan-950/15 border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                        : "bg-[#030611]/70 border-[#1f2937]/50 text-gray-300 hover:text-white hover:border-cyan-500/30"
                    }`}
                  >
                    <span className="pr-4 leading-normal">{opt}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950"
                          : "border-gray-700 group-hover:border-cyan-500/40"
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer Navigation bar */}
            <div className="flex justify-between items-center border-t border-gray-800 pt-5 mt-2">
              <button
                onClick={prevQuestion}
                disabled={activeQuestionIndex === 0}
                className="px-3.5 py-2 border border-gray-800 hover:border-cyan-500/30 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:hover:border-gray-800 disabled:hover:text-gray-400 rounded-lg flex items-center gap-1 text-xs font-mono transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {activeQuestionIndex === totalQuestions - 1 ? (
                <button
                  onClick={handleFinishQuiz}
                  disabled={!selectedOption}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:hover:from-cyan-600 disabled:hover:to-indigo-600 rounded-lg flex items-center gap-1 text-xs font-mono font-bold shadow-lg hover:shadow-cyan-500/10 border border-cyan-400/20 transition-all"
                >
                  <span>Submit Quiz</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  disabled={!selectedOption}
                  className="px-4 py-2 bg-[#040c1a] border border-[#1f2937] hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 disabled:hover:border-gray-800 disabled:hover:text-cyan-400 rounded-lg flex items-center gap-1 text-xs font-mono transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: ANALYZING LOADER */}
        {quizPhase === "analyzing" && (
          <div className="bg-[#070b19]/90 border border-[#1f2937]/50 rounded-2xl p-8 shadow-2xl text-center space-y-5 font-mono text-cyan-400">
            <Cpu className="w-14 h-14 text-cyan-400 animate-spin mx-auto shadow-inner shadow-cyan-500/20" />
            <h2 className="text-sm font-bold uppercase tracking-widest animate-pulse">
              Running Diagnostic Evaluation Core
            </h2>
            <div className="max-w-md mx-auto bg-gray-950 border border-gray-900 p-4 rounded-xl text-[11px] text-gray-500 text-left space-y-1.5 leading-relaxed uppercase">
              <p>➔ Analyzing Concept-wise success ratios...</p>
              <p>➔ Estimating user dynamic learning speed profile...</p>
              <p>➔ Compiling custom practice project directives...</p>
              <p>➔ Querying Gemini Generative Graph compilation...</p>
            </div>
          </div>
        )}

        {/* PHASE 3: COMPLETED ASSESSMENT ANALYSIS DISPLAY */}
        {quizPhase === "completed" && evaluationResult && (
          <div className="bg-[#070b19]/90 border border-[#1f2937]/50 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6 select-text">
            {/* Header Title */}
            <div className="text-center space-y-1.5 border-b border-gray-800 pb-5">
              <h2 className="font-orbitron font-extrabold text-lg tracking-widest text-cyan-400 uppercase">
                Assessment Diagnostics Compiled
              </h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Telemetry profile generated via Gemini AI
              </p>
            </div>

            {/* Score Ring / Metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-[#030611] border border-gray-800/80 rounded-xl text-center space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">
                  Accuracy Score
                </span>
                <span className="font-orbitron font-black text-2xl text-cyan-400 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-cyan-400" /> {evaluationResult.score}%
                </span>
              </div>

              <div className="p-4 bg-[#030611] border border-gray-800/80 rounded-xl text-center space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">
                  Confidence Metric
                </span>
                <span className="font-orbitron font-black text-xs md:text-sm uppercase tracking-wider text-indigo-400 flex items-center justify-center h-8 gap-1">
                  <BarChart2 className="w-4 h-4 text-indigo-400" /> {evaluationResult.confidence_rating}
                </span>
              </div>

              <div className="p-4 bg-[#030611] border border-gray-800/80 rounded-xl text-center space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">
                  Learning Velocity
                </span>
                <span className="font-orbitron font-black text-xs md:text-sm uppercase tracking-wider text-emerald-400 flex items-center justify-center h-8 gap-1">
                  <Flame className="w-4 h-4 text-emerald-400 animate-pulse" /> {evaluationResult.learning_speed_estimate}
                </span>
              </div>
            </div>

            {/* Summary card */}
            <div className="p-4 bg-[#030611]/80 border border-[#1f2937]/50 rounded-xl space-y-2 select-text">
              <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Diagnostic Summary Profile
              </h4>
              <p className="text-xs leading-relaxed text-gray-300 font-sans select-text">
                {evaluationResult.summary}
              </p>
            </div>

            {/* Strengths & Weaknesses listing */}
            <div className="grid md:grid-cols-2 gap-4 select-text">
              {/* Weaknesses card */}
              <div className="p-4 bg-red-950/5 border border-red-500/10 rounded-xl space-y-3 select-text">
                <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                  ⚠️ Core Concept Weaknesses (Targeted)
                </h4>
                <div className="flex flex-wrap gap-2 select-text">
                  {evaluationResult.weak_concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-red-950/20 border border-red-500/20 text-[10px] font-mono text-red-300"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths card */}
              <div className="p-4 bg-emerald-950/5 border border-emerald-500/10 rounded-xl space-y-3 select-text">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  ✓ Core Concept Superpowers (Validated)
                </h4>
                <div className="flex flex-wrap gap-2 select-text">
                  {evaluationResult.strong_concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-emerald-950/20 border border-emerald-500/20 text-[10px] font-mono text-emerald-300"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action drawer */}
            <div className="border-t border-gray-800 pt-5 mt-2 text-center">
              <button
                onClick={handleGenerateRoadmap}
                disabled={isRedirecting}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-orbitron font-extrabold text-xs tracking-widest uppercase shadow-lg hover:shadow-cyan-500/20 border border-cyan-400/20 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 transition-all"
              >
                {isRedirecting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                    <span>Building Neural Graph Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Personalized Workspace</span>
                    <ChevronRight className="w-4 h-4 text-cyan-300" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
