"use client";

import React, { useState } from "react";
import { Video, FileText, CheckCircle, Lightbulb, PlayCircle, BookOpen, Code, Trophy, Download, ExternalLink } from "lucide-react";

/**
 * ResourceHub Component
 * =====================
 * Tabbed panel: Tutorials (Videos + Docs + Notes), Mini Project, Challenges.
 * Notes tab opens inline PDF-style study guides served from /notes/.
 */
export default function ResourceHub({ activeNode, toggleNodeCompletion }: {
  activeNode: any;
  toggleNodeCompletion: (nodeId: string, completed: boolean) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState("tutorials");

  if (!activeNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#070b19]/80 border border-[#1f2937]/40 rounded-xl p-8 text-center font-mono">
        <Lightbulb className="w-10 h-10 text-gray-500 mb-3 animate-pulse" />
        <p className="text-gray-400 text-sm">Select a roadmap node to access resources, notes, and challenges.</p>
      </div>
    );
  }

  const isCompleted = activeNode.status === "completed";
  const resources   = activeNode.resources || [];
  const videos      = resources.filter((r: any) => r.type === "video");
  const docs        = resources.filter((r: any) => r.type === "docs");
  const notes       = resources.filter((r: any) => r.type === "notes");
  const tasks       = activeNode.practice_tasks || [];

  const tabs = [
    { id: "tutorials", label: "Tutorials", count: videos.length + docs.length },
    { id: "notes",     label: "📄 Notes",  count: notes.length },
    { id: "projects",  label: "Project",   count: null },
    { id: "exercises", label: "Challenges",count: tasks.length },
  ];

  return (
    <div className="h-full flex flex-col bg-[#070b19]/90 border border-[#1f2937]/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">

      {/* Node Header */}
      <div className="p-5 border-b border-[#1f2937]/60 bg-[#030712]/90 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400">
            {activeNode.phase}
          </span>
          <span className="font-mono text-[10px] text-gray-500">
            Est: {activeNode.estimated_hours}h
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
            <span>{isCompleted ? "Completed ✓" : "Mark Complete"}</span>
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-[#030712]/50 border-b border-[#1f2937]/40 px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 py-3 text-[10px] font-mono border-b-2 font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === tab.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-[9px] px-1 py-0.5 rounded font-mono ${activeSubTab === tab.id ? "bg-cyan-900/40 text-cyan-400" : "bg-gray-800 text-gray-500"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── TUTORIALS TAB ─────────────────────────────────── */}
        {activeSubTab === "tutorials" && (
          <div className="space-y-5">

            {/* Videos */}
            {videos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5 text-red-400" />
                  Video Tutorials
                </h4>
                {videos.map((res: any, i: number) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-[#030611] hover:bg-red-950/10 border border-[#1f2937]/50 hover:border-red-500/30 rounded-lg flex gap-3 transition-all group"
                  >
                    <div className="w-9 h-9 bg-red-950/20 rounded-lg border border-red-500/20 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-200 leading-snug group-hover:text-red-400 transition-colors">{res.title}</p>
                      <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 mt-1">
                        <ExternalLink className="w-2.5 h-2.5" /> Watch on YouTube
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Docs */}
            {docs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Documentation & References
                </h4>
                {docs.map((res: any, i: number) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-[#030611] hover:bg-indigo-950/10 border border-[#1f2937]/50 hover:border-indigo-500/30 rounded-lg flex gap-3 transition-all group"
                  >
                    <div className="w-9 h-9 bg-indigo-950/20 rounded-lg border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-200 leading-snug group-hover:text-indigo-400 transition-colors">{res.title}</p>
                      <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 mt-1">
                        <ExternalLink className="w-2.5 h-2.5" /> Open Documentation
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {videos.length === 0 && docs.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No tutorials linked for this node.</p>
            )}
          </div>
        )}

        {/* ── NOTES TAB ─────────────────────────────────────── */}
        {activeSubTab === "notes" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-950/10 border border-amber-500/20 rounded-lg">
              <p className="text-[10px] font-mono text-amber-400/80 leading-relaxed">
                📄 In-depth study guides for this phase — open in browser and use <strong className="text-amber-400">Save as PDF</strong> to save offline.
              </p>
            </div>

            {notes.length > 0 ? (
              notes.map((res: any, i: number) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-[#030611] hover:bg-amber-950/10 border border-amber-500/20 hover:border-amber-500/40 rounded-lg flex gap-3 transition-all group"
                >
                  <div className="w-10 h-10 bg-amber-950/20 rounded-lg border border-amber-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-200 group-hover:text-amber-400 transition-colors leading-snug">{res.title}</p>
                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 mt-1.5">
                      <Download className="w-2.5 h-2.5" /> Open & Save as PDF
                    </span>
                  </div>
                  <div className="shrink-0 self-center">
                    <span className="text-[9px] font-mono bg-amber-900/30 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Guide</span>
                  </div>
                </a>
              ))
            ) : (
              <div className="text-center py-8 space-y-2">
                <FileText className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-500">Notes for this phase coming soon.</p>
                <p className="text-[10px] font-mono text-gray-600">Check the Tutorials tab for video resources.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PROJECT TAB ───────────────────────────────────── */}
        {activeSubTab === "projects" && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              Mini Project Capsule
            </h4>

            {activeNode.mini_project ? (
              <div className="p-4 bg-[#030611] border border-yellow-500/15 rounded-lg space-y-3">
                <h5 className="text-sm font-extrabold text-yellow-400 font-mono">
                  🚀 {activeNode.mini_project.title}
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {activeNode.mini_project.description}
                </p>
                <div className="bg-yellow-950/10 border border-yellow-800/10 p-3 rounded text-[11px] text-gray-400 leading-relaxed font-mono">
                  <span className="text-yellow-500 font-bold block mb-1.5">💡 HOW TO SUBMIT:</span>
                  1. Build it in your local workspace.<br />
                  2. Commit to GitHub with a clear README.<br />
                  3. Paste your code into the AI Mentor chat for review.<br />
                  4. Mark this node as Complete when done ✓
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No project defined for this node.</p>
            )}
          </div>
        )}

        {/* ── CHALLENGES TAB ────────────────────────────────── */}
        {activeSubTab === "exercises" && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              Practice Challenges ({tasks.length})
            </h4>

            {tasks.map((task: string, i: number) => (
              <div
                key={i}
                className="p-3 bg-[#030611] border border-[#1f2937]/50 hover:border-emerald-500/20 rounded-lg flex items-start gap-2.5 transition-all"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] shrink-0 font-mono font-bold">
                  {i + 1}
                </span>
                <p className="text-xs text-gray-300 leading-relaxed">{task}</p>
              </div>
            ))}

            {tasks.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No challenges defined for this node.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
