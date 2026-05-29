"use client";

import React, { useState } from "react";
import { Youtube, FileText, CheckCircle, Lightbulb, PlayCircle, BookOpen, Code, Trophy } from "lucide-react";

/**
 * ResourceHub Component (Student-Friendly Version)
 * ===============================================
 * Tabbed panel displaying curated tutorials, modular projects, and coding 
 * challenges for the selected node.
 * 
 * Props:
 * - activeNode: The active Roadmap Node selected by user
 * - toggleNodeCompletion: Callback to mark a node complete/incomplete
 */
export default function ResourceHub({ activeNode, toggleNodeCompletion }) {
  const [activeSubTab, setActiveSubTab] = useState("tutorials");

  if (!activeNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#070b19]/80 border border-[#1f2937]/40 rounded-xl p-8 text-center font-mono">
        <Lightbulb className="w-10 h-10 text-gray-500 mb-3 animate-pulse" />
        <p className="text-gray-400 text-sm">Select a roadmap node to access dynamic resource databases.</p>
      </div>
    );
  }

  const isCompleted = activeNode.status === "completed";

  return (
    <div className="h-full flex flex-col bg-[#070b19]/90 border border-[#1f2937]/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      
      {/* Node Header Info Card */}
      <div className="p-5 border-b border-[#1f2937]/60 bg-[#030712]/90 flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400">
            {activeNode.phase}
          </span>
          <span className="font-mono text-[10px] text-gray-500">
            Est: {activeNode.estimated_hours} Hours
          </span>
        </div>

        <h2 className="font-sans font-extrabold text-lg text-white leading-tight">
          {activeNode.title}
        </h2>
        
        <p className="text-xs text-gray-400 leading-relaxed font-sans mt-0.5">
          {activeNode.description}
        </p>

        {/* Completion Toggle */}
        <div className="flex items-center justify-between border-t border-[#1f2937]/50 pt-4 mt-1">
          <span className="text-xs font-mono text-gray-500">Node Status:</span>
          <button
            onClick={() => toggleNodeCompletion(activeNode.id, !isCompleted)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
              isCompleted
                ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "bg-cyan-950/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? "Completed!" : "Mark Complete"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs bar */}
      <div className="flex bg-[#030712]/50 border-b border-[#1f2937]/40 px-3">
        <button
          onClick={() => setActiveSubTab("tutorials")}
          className={`flex-1 py-3 text-xs font-mono border-b-2 font-semibold transition-all cursor-pointer ${
            activeSubTab === "tutorials"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          Tutorials
        </button>
        <button
          onClick={() => setActiveSubTab("projects")}
          className={`flex-1 py-3 text-xs font-mono border-b-2 font-semibold transition-all cursor-pointer ${
            activeSubTab === "projects"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          Mini Project
        </button>
        <button
          onClick={() => setActiveSubTab("exercises")}
          className={`flex-1 py-3 text-xs font-mono border-b-2 font-semibold transition-all cursor-pointer ${
            activeSubTab === "exercises"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          Challenges
        </button>
      </div>

      {/* Tab Panels Contents list */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-800 space-y-4">
        
        {/* TAB 1: TUTORIALS & DOCS */}
        {activeSubTab === "tutorials" && (
          <div className="space-y-4 select-text">
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-cyan-400" />
              <span>Recommended Video Tutorials</span>
            </h4>
            
            <div className="grid gap-3">
              {activeNode.resources
                .filter((r) => r.type === "video")
                .map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-[#030611] hover:bg-cyan-950/10 border border-[#1f2937]/50 hover:border-cyan-500/30 rounded-lg flex gap-3 transition-all group"
                  >
                    <div className="w-10 h-10 bg-red-950/20 rounded-lg border border-red-500/20 flex items-center justify-center shrink-0">
                      <Youtube className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-200 leading-snug group-hover:text-cyan-400 transition-colors truncate">
                        {res.title}
                      </p>
                      <span className="text-[10px] font-mono text-gray-500 block mt-1 uppercase">
                        Search on YouTube ➔
                      </span>
                    </div>
                  </a>
                ))}
            </div>

            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pt-4">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Documentation & Standards</span>
            </h4>

            <div className="grid gap-3">
              {activeNode.resources
                .filter((r) => r.type === "docs")
                .map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-[#030611] hover:bg-indigo-950/10 border border-[#1f2937]/50 hover:border-indigo-500/30 rounded-lg flex gap-3 transition-all group"
                  >
                    <div className="w-10 h-10 bg-indigo-950/20 rounded-lg border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-200 leading-snug group-hover:text-indigo-400 transition-colors truncate">
                        {res.title}
                      </p>
                      <span className="text-[10px] font-mono text-gray-500 block mt-1">
                        Read Specifications ➔
                      </span>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: MINI PROJECT SPEC */}
        {activeSubTab === "projects" && (
          <div className="space-y-4 select-text">
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Modular Project Capsule</span>
            </h4>

            {activeNode.mini_project ? (
              <div className="p-4 bg-[#030611] border border-yellow-500/10 rounded-lg space-y-3">
                <h5 className="text-xs font-extrabold text-yellow-500 font-mono">
                  🚀 Project: {activeNode.mini_project.title}
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {activeNode.mini_project.description}
                </p>
                <div className="bg-yellow-950/10 border border-yellow-800/10 p-3 rounded text-[11px] text-gray-400 leading-relaxed font-mono">
                  <span className="text-yellow-500 font-bold block mb-1">CAPSTONE SUGGESTIONS:</span>
                  1. Implement inside local workspace.<br />
                  2. Commit features to GitHub.<br />
                  3. Feed snippet logs to AI Mentor chat for validation.
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Project details loading...</p>
            )}
          </div>
        )}

        {/* TAB 3: PRACTICE CHALLENGES */}
        {activeSubTab === "exercises" && (
          <div className="space-y-4 select-text">
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-400" />
              <span>Interactive Code Challenges</span>
            </h4>

            <div className="space-y-3">
              {activeNode.practice_tasks.map((task, i) => (
                <div
                  key={i}
                  className="p-3 bg-[#030611] border border-[#1f2937]/50 rounded-lg flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] shrink-0 font-mono">
                    {i + 1}
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {task}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
