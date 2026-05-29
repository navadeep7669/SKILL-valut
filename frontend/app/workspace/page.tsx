"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "../../hooks/useWorkspaceStore";

import Sidebar from "../../components/Sidebar";
import RoadmapGraph from "../../components/RoadmapGraph";
import AITerminal from "../../components/AITerminal";
import ResourceHub from "../../components/ResourceHub";

import { Terminal, Settings, Cpu, ChevronRight, Folder, FolderOpen, FileCode, CheckCircle, Zap } from "lucide-react";

export default function WorkspacePage() {
  const router = useRouter();
  const {
    isSessionActive,
    domain,
    roadmapData,
    fetchRoadmap,
    activeNode,
    selectNode,
    activeTab,
    setActiveTab,
    clearSession,
    toggleNodeCompletion,
    chatMessages,
    sendChatMessage,
    isChatLoading
  } = useWorkspaceStore();

  useEffect(() => {
    if (!isSessionActive) {
      router.push("/");
      return;
    }
    fetchRoadmap();
  }, [isSessionActive]);

  if (!roadmapData) {
    return (
      <div className="min-h-screen bg-[#030611] flex flex-col items-center justify-center font-mono text-cyan-400">
        <Cpu className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <span>INITIALIZING QUANTUM MULTIVERSAL WORKSPACE ENGINE...</span>
      </div>
    );
  }

  // Extract nodes by phases for Concept File Explorer sidebar
  const phase1Nodes = roadmapData.nodes.filter((n) => n.phase.includes("Phase 1"));
  const phase2Nodes = roadmapData.nodes.filter((n) => n.phase.includes("Phase 2"));
  const phase3Nodes = roadmapData.nodes.filter((n) => n.phase.includes("Phase 3"));

  return (
    <div className="h-screen w-screen bg-[#030611] text-gray-200 overflow-hidden flex flex-col font-sans select-none">
      
      {/* 1. FUTURISTIC TOP MAIN MENU HEADER */}
      <header className="h-11 bg-[#030712] border-b border-[#1f2937]/50 flex items-center justify-between px-4 shrink-0 font-mono text-xs z-20">
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
            <Settings className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKING INTERFACE AREA */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Side Tab Navigation bar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab: any) => setActiveTab(tab)} 
          onExit={clearSession} 
        />

        {/* 3. VS CODE INTEGRATION PANEL: EXPLORER SIDEBAR */}
        <div className="w-64 bg-[#050915] border-r border-[#1f2937]/40 h-full flex flex-col shrink-0">
          <div className="p-3 border-b border-[#1f2937]/40 flex items-center justify-between font-mono text-[10px] tracking-wider text-gray-400 uppercase select-none">
            <span>Concept Explorer</span>
            <FolderOpen className="w-3.5 h-3.5 text-cyan-500/80" />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 font-mono text-xs">
            {/* Phase 1 Folder */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 px-1.5 py-1">
                <Folder className="w-4 h-4" />
                <span className="font-bold tracking-wide uppercase text-[9px]">Fundamentals</span>
              </div>
              <div className="pl-3 space-y-0.5">
                {phase1Nodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => selectNode(node)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left truncate ${
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

            {/* Phase 2 Folder */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 px-1.5 py-1">
                <Folder className="w-4 h-4" />
                <span className="font-bold tracking-wide uppercase text-[9px]">Deep Dive (Weak Qs)</span>
              </div>
              <div className="pl-3 space-y-0.5">
                {phase2Nodes.map((node) => {
                  const isLocked = node.status === "locked";
                  return (
                    <button
                      key={node.id}
                      disabled={isLocked}
                      onClick={() => selectNode(node)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left truncate ${
                        isLocked ? "opacity-35 cursor-not-allowed" : "cursor-pointer"
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

            {/* Phase 3 Folder */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 px-1.5 py-1">
                <Folder className="w-4 h-4" />
                <span className="font-bold tracking-wide uppercase text-[9px]">Applied Architecture</span>
              </div>
              <div className="pl-3 space-y-0.5">
                {phase3Nodes.map((node) => {
                  const isLocked = node.status === "locked";
                  return (
                    <button
                      key={node.id}
                      disabled={isLocked}
                      onClick={() => selectNode(node)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left truncate ${
                        isLocked ? "opacity-35 cursor-not-allowed" : "cursor-pointer"
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

        {/* 4. CENTRAL WORKING CANVAS */}
        <main className="flex-1 h-full p-4 flex flex-col min-w-0 z-10">
          
          {/* Tab Navigation Editor bar */}
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-[10px] font-mono text-gray-500 uppercase select-none">Active Matrix Workspace:</span>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <div className="px-2.5 py-1 bg-[#050816] border border-gray-800 rounded font-mono text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeTab === "roadmap" ? "SVG Anti-Gravity Neural Graph" : activeTab.toUpperCase()}</span>
            </div>
          </div>

          {/* Central Workspace Component Swap Layout */}
          <div className="flex-1 min-h-0 relative">
            {activeTab === "roadmap" && (
              <RoadmapGraph 
                roadmapData={roadmapData} 
                activeNode={activeNode} 
                selectNode={selectNode} 
                toggleNodeCompletion={toggleNodeCompletion}
              />
            )}
            {activeTab === "explorer" && (
              <div className="h-full flex flex-col justify-center items-center bg-[#070b19]/80 border border-gray-800 rounded-2xl p-6 font-mono text-center">
                <FolderOpen className="w-12 h-12 text-cyan-400 mb-3 animate-pulse" />
                <h4 className="text-gray-300 font-bold mb-1">Concept Explorer Mode</h4>
                <p className="text-xs text-gray-500 max-w-sm">Use the left Explorer panel tree list to browse through learning concepts in detail.</p>
              </div>
            )}
            {activeTab === "resources" && (
              <ResourceHub 
                activeNode={activeNode} 
                toggleNodeCompletion={toggleNodeCompletion}
              />
            )}
            {activeTab === "terminal" && (
              <AITerminal 
                chatMessages={chatMessages} 
                onSendMessage={sendChatMessage} 
                isChatLoading={isChatLoading} 
                activeNode={activeNode}
              />
            )}
          </div>
        </main>

        {/* 5. FLOATING DOCKABLE AI MENTOR SPLIT PANEL */}
        {activeTab !== "terminal" && (
          <aside className="w-80 h-full p-4 pl-0 shrink-0 flex flex-col z-10">
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
  );
}
