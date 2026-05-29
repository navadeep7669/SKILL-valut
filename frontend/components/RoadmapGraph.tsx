"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, CheckCircle, Clock, Zap } from "lucide-react";

/**
 * Roadmap Graph Component (Student-Friendly Version)
 * ==================================================
 * Renders an interactive SVG node graph. Connects conceptual nodes 
 * via curved paths with glowing energy trace lines.
 * 
 * Props:
 * - roadmapData: Roadmap data object { domain, nodes, connections }
 * - activeNode: The active Roadmap Node selected by user
 * - selectNode: Callback to update active Node selection
 * - toggleNodeCompletion: Callback to mark a node complete/incomplete
 */
export default function RoadmapGraph({ roadmapData, activeNode, selectNode, toggleNodeCompletion }: {
  roadmapData: any;
  activeNode: any;
  selectNode: (node: any) => void;
  toggleNodeCompletion: (nodeId: string, completed: boolean) => void;
}) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject the @keyframes dash animation into the document head once
  useEffect(() => {
    const styleId = "roadmap-dash-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `@keyframes dash { to { stroke-dashoffset: -120; } }`;
      document.head.appendChild(style);
    }
  }, []);

  if (!roadmapData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050814]/40 border border-gray-800/40 rounded-xl py-20 text-center font-mono select-none">
        <Clock className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading neural nodes array...</p>
      </div>
    );
  }

  const { nodes, connections } = roadmapData;

  // Simple zoom buttons callbacks
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 1.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.7));
  const handleReset = () => setScale(1);

  return (
    <div className="h-full flex flex-col bg-[#050816]/70 border border-[#1f2937]/40 rounded-xl overflow-hidden shadow-2xl relative select-none">
      
      {/* Zoom Controller Overlay widgets */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 font-mono text-[11px]">
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded border border-gray-800 bg-[#030712]/90 text-gray-400 hover:text-white hover:border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer"
        >
          -
        </button>
        <button
          onClick={handleReset}
          className="px-2.5 h-8 rounded border border-gray-800 bg-[#030712]/90 text-gray-400 hover:text-white hover:border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded border border-gray-800 bg-[#030712]/90 text-gray-400 hover:text-white hover:border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer"
        >
          +
        </button>
      </div>

      <div className="absolute top-4 left-4 z-10 font-mono flex items-center gap-1.5 text-xs text-gray-400 bg-gray-950/80 border border-gray-800 px-3 py-1.5 rounded-lg">
        <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>DRAG TO PAN MAP</span>
      </div>

      {/* Pannable Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(31, 41, 55, 0.25) 1px, transparent 0),
            radial-gradient(circle at 2px 2px, rgba(6, 182, 212, 0.03) 2px, transparent 0)
          `,
          backgroundSize: "24px 24px, 120px 120px"
        }}
      >
        <motion.div
          drag
          dragMomentum={true}
          style={{ scale }}
          className="w-[1100px] h-[650px] relative origin-center"
        >
          {/* SVG Connections Layer (Curved Traces) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="glowing-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {connections.map((conn: any, idx: number) => {
              const fromNode = nodes.find((n: any) => n.id === conn.from);
              const toNode = nodes.find((n: any) => n.id === conn.to);

              if (!fromNode || !toNode) return null;

              // Connect nodes with a beautiful Bezier curve
              const dx = toNode.x - fromNode.x;
              const x1 = fromNode.x;
              const y1 = fromNode.y;
              const x2 = toNode.x;
              const y2 = toNode.y;
              const pathStr = `M ${x1} ${y1} C ${x1 + dx * 0.4} ${y1}, ${x2 - dx * 0.4} ${y2}, ${x2} ${y2}`;

              const isUnlocked = fromNode.status === "completed";

              return (
                <g key={idx}>
                  {/* Underlay curve glow */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={isUnlocked ? "rgba(6, 182, 212, 0.12)" : "rgba(31, 41, 55, 0.3)"}
                    strokeWidth={isUnlocked ? 8 : 4}
                  />
                  {/* Base curve line */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={isUnlocked ? "url(#glowing-grad)" : "#1f2937"}
                    strokeWidth={isUnlocked ? 3 : 2}
                  />
                  {/* Glowing electric dash pulse */}
                  {isUnlocked && (
                    <path
                      d={pathStr}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      strokeDasharray="12, 24"
                      className="animate-[dash_6s_linear_infinite]"
                      style={{
                        animation: "dash 4s linear infinite"
                      }}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Nodes Layer */}
          {nodes.map((node: any) => {
            const isActive = activeNode?.id === node.id;
            
            // Setup style attributes based on lock/completed status
            let borderClass = "border-gray-800 bg-[#0b0f19]/90 text-gray-500 shadow-lg";
            let glow = "rgba(107, 114, 128, 0.15)";
            let statusIcon = <Lock className="w-3.5 h-3.5 text-gray-600" />;

            if (node.status === "completed") {
              borderClass = "border-emerald-500 bg-[#061014] text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/20";
              glow = "rgba(16, 185, 129, 0.35)";
              statusIcon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
            } else if (node.status === "unlocked" || node.status === "in_progress") {
              borderClass = "border-cyan-500 bg-[#040f1a] text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/20";
              glow = "rgba(6, 182, 212, 0.35)";
              statusIcon = <Unlock className="w-3.5 h-3.5 text-cyan-400" />;
            }

            if (isActive) {
              borderClass += " ring-2 ring-indigo-500 scale-[1.03] border-indigo-400 z-10 shadow-indigo-500/30";
            }

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={node.status !== "locked" ? { y: -6, scale: 1.02 } : {}}
                style={{
                  position: "absolute",
                  left: node.x - 110, // Center positioning variables
                  top: node.y - 45,
                  width: 220,
                  height: 90
                }}
                className="z-10"
              >
                <div
                  onClick={() => node.status !== "locked" && selectNode(node)}
                  className={`w-full h-full px-4 py-3 rounded-xl border flex flex-col justify-between transition-all select-none ${
                    node.status !== "locked" ? "cursor-pointer" : "cursor-not-allowed"
                  } ${borderClass}`}
                  style={{
                    boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 16px ${glow}`
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500">
                      {node.phase.split(":")[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      {statusIcon}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-xs truncate leading-tight mt-1 text-gray-200">
                    {node.title}
                  </h3>

                  <div className="flex justify-between items-center text-[10px] mt-2 font-mono text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400/70" /> {node.estimated_hours}h
                    </span>
                    
                    {node.status !== "locked" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNodeCompletion(node.id, node.status !== "completed");
                        }}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-colors cursor-pointer ${
                          node.status === "completed"
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/30"
                            : "bg-cyan-950/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-900/30"
                        }`}
                      >
                        {node.status === "completed" ? "Completed" : "Mark Done"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
