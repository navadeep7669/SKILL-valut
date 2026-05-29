"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal, Send, Cpu, Bot, User, Check, Copy } from "lucide-react";

/**
 * AI Terminal Component (Student-Friendly Version)
 * ================================================
 * Renders a high-fidelity monospaced console interface simulating
 * an AI dialogue stream. Includes a clean custom markdown parser
 * that renders code snippets cleanly.
 * 
 * Props:
 * - chatMessages: Array of msg objects { role, content }
 * - onSendMessage: Async callback to send a message string to backend
 * - isChatLoading: Loading state boolean (adds loading indicators)
 * - activeNode: The active Roadmap Node selected by user
 */
export default function AITerminal({ chatMessages, onSendMessage, isChatLoading, activeNode }: {
  chatMessages: Array<{ role: string; content: string }>;
  onSendMessage: (msg: string) => void;
  isChatLoading: boolean;
  activeNode: any;
}) {
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically scrolls the message list down when new chat dialogues arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#070b19]/80 border border-[#1f2937]/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      
      {/* Terminal Title Bar */}
      <div className="bg-[#030712] px-4 py-2.5 border-b border-[#1f2937]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Classic Mac-style visual dot buttons */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-gray-500 mx-2 text-xs font-mono">|</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>quantum_ai_mentor.sh</span>
          </div>
        </div>
        {activeNode && (
          <div className="text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
            Topic: {activeNode.title}
          </div>
        )}
      </div>

      {/* Messages Drawer Window */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-800"
      >
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 leading-relaxed max-w-[90%] p-3 rounded-lg ${
              msg.role === "user"
                ? "ml-auto bg-cyan-950/20 border border-cyan-900/30 text-cyan-100 flex-row-reverse"
                : "bg-indigo-950/15 border border-indigo-950/40 text-gray-200"
            }`}
          >
            {/* Message Sender Icon Badge */}
            <div className="shrink-0">
              {msg.role === "user" ? (
                <div className="w-7 h-7 rounded bg-cyan-900/40 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded bg-indigo-950 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content Display */}
            <div className="flex-1 space-y-2 whitespace-pre-wrap select-text">
              {renderMarkdown(msg.content)}
            </div>
          </div>
        ))}

        {/* loading indicator card */}
        {isChatLoading && (
          <div className="flex gap-3 leading-relaxed max-w-[80%] p-3 rounded-lg bg-indigo-950/15 border border-indigo-950/40">
            <div className="w-7 h-7 rounded bg-indigo-950 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
            <div className="text-gray-400 flex items-center gap-1.5">
              <span>Computing conceptual node arrays</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce [animation-delay:0.2s]">.</span>
              <span className="animate-bounce [animation-delay:0.4s]">.</span>
            </div>
          </div>
        )}
      </div>

      {/* Form Terminal Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-[#1f2937]/50 bg-[#030712]/90 p-3 flex gap-2">
        <div className="flex-1 flex items-center bg-[#070c1b] border border-gray-800 rounded-lg px-3 focus-within:border-cyan-500/60 focus-within:shadow-[0_0_10px_rgba(6,182,212,0.1)] transition-all">
          <span className="text-cyan-400 mr-2 text-xs font-mono font-bold">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isChatLoading}
            placeholder={activeNode ? `Ask anything about ${activeNode.title}...` : "Ask a technical question..."}
            className="flex-1 bg-transparent py-2.5 outline-none text-gray-200 text-xs font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isChatLoading || !input.trim()}
          className="px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg flex items-center justify-center transition-all shadow-lg hover:shadow-cyan-500/20 border border-cyan-400/20 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}

/**
 * Helper: Student-Friendly Custom Markdown Parser
 * Renders bold headers, inline code grids, and code containers.
 */
function renderMarkdown(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    // 1. Identify Code Blocks
    if (part.startsWith("```")) {
      const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
      const language = match ? match[1] : "code";
      const codeContent = match ? match[2] : part.slice(3, -3);
      return <CodeBlock key={index} code={codeContent.trim()} language={language || "typescript"} />;
    }

    // 2. Otherwise Parse Regular Paragraphs
    const inlineParts = part.split(/`([^`]+)`/g);
    return (
      <p key={index} className="mb-2 leading-relaxed font-sans text-xs sm:text-sm">
        {inlineParts.map((subPart, j) => {
          if (j % 2 === 1) {
            // Render Inline Code Highlights
            return (
              <code key={j} className="bg-cyan-950/40 text-cyan-400 border border-cyan-800/30 px-1.5 py-0.5 rounded text-xs select-all font-mono">
                {subPart}
              </code>
            );
          }
          
          // Render Bold elements
          const boldParts = subPart.split(/\*\*([^*]+)\*\*/g);
          return boldParts.map((boldPart, k) => {
            if (k % 2 === 1) {
              return <strong key={k} className="text-cyan-400 font-bold">{boldPart}</strong>;
            }
            return boldPart;
          });
        })}
      </p>
    );
  });
}

/**
 * Child Component: Clean CodeBlock with instant Copy clipboard helper.
 */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-[#1f2937]/75 rounded-lg overflow-hidden my-3 bg-[#030611] shadow-md select-text">
      <div className="bg-[#050918] px-3 py-1.5 border-b border-[#1f2937]/40 flex items-center justify-between text-[11px] text-gray-500 font-mono select-none">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 hover:text-gray-300 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed text-indigo-200/90 font-mono select-all">
        <code>{code}</code>
      </pre>
    </div>
  );
}
