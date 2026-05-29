import React from "react";
import { Terminal, Map, FolderOpen, Award, Activity, LogOut } from "lucide-react";

/**
 * Sidebar Component (Student-Friendly Version)
 * ============================================
 * Provides navigation buttons inside the developer workspace.
 * Renders icons from the 'lucide-react' library.
 * 
 * Props:
 * - activeTab: The current tab string ('roadmap', 'explorer', 'resources', 'terminal')
 * - setActiveTab: Function to update the parent's active tab state
 * - onExit: Function to reset session and go back to welcome screen
 */
export default function Sidebar({ activeTab, setActiveTab, onExit }) {
  return (
    <aside className="w-16 bg-[#030712] border-r border-[#1f2937]/50 flex flex-col items-center py-4 justify-between h-full shrink-0 select-none">
      
      {/* Top Section: Logo & Tab Buttons */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Futuristic Glassmorphic S Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
          <span className="font-orbitron font-extrabold text-white text-lg tracking-tighter">S</span>
        </div>
        
        {/* Navigation Bar */}
        <nav className="flex flex-col items-center gap-4 w-full px-2">
          {/* Tab Button 1: Roadmap */}
          <button
            onClick={() => setActiveTab("roadmap")}
            title="Roadmap Graph View"
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "roadmap"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 border border-transparent"
            }`}
          >
            <Map className="w-5 h-5" />
          </button>

          {/* Tab Button 2: Explorer */}
          <button
            onClick={() => setActiveTab("explorer")}
            title="Concept Explorer Folder Tree"
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "explorer"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 border border-transparent"
            }`}
          >
            <FolderOpen className="w-5 h-5" />
          </button>

          {/* Tab Button 3: Resource Hub */}
          <button
            onClick={() => setActiveTab("resources")}
            title="Curated Tutorial Hub"
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "resources"
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 border border-transparent"
            }`}
          >
            <Award className="w-5 h-5" />
          </button>

          {/* Tab Button 4: AI Mentor Chat */}
          <button
            onClick={() => setActiveTab("terminal")}
            title="AI Mentor Terminal"
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "terminal"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 border border-transparent"
            }`}
          >
            <Terminal className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Bottom Section: Telemetries & Exit */}
      <div className="flex flex-col items-center gap-4 w-full px-2">
        {/* Sync Telemetry Indicator */}
        <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center bg-gray-950" title="Quantum Sync Active">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        </div>

        {/* Exit Button */}
        <button
          onClick={onExit}
          title="Exit Workspace"
          className="w-11 h-11 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-950/20 border border-transparent transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

    </aside>
  );
}
