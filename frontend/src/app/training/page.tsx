"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Brain, Zap, TrendingUp, RefreshCw, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Activity, Cpu, Database,
  ArrowRight, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface TrainingCorrection {
  doc_id: string;
  timestamp: string;
  original_type: string;
  corrected_type: string;
  original_name: string;
  corrected_name: string;
}

interface TrainingStatus {
  total_corrections: number;
  model_improvements: number;
  recent_corrections: TrainingCorrection[];
  learning_active: boolean;
}

const PIPELINE_STAGES = [
  {
    id: 1,
    icon: Brain,
    title: "User Flags AI Error",
    description:
      "User clicks 'Flag AI Error' in the Dashboard's Audit Ledger panel and corrects the wrong field.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    id: 2,
    icon: Database,
    title: "Correction Logged",
    description:
      "The original prediction and user correction are saved to the ai_training_data queue in the secure ledger.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  {
    id: 3,
    icon: Cpu,
    title: "Similarity Search",
    description:
      "On the next document upload, OCR text is compared via difflib against all past corrections (≥85% match threshold).",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  {
    id: 4,
    icon: Zap,
    title: "Override Applied",
    description:
      "If a match is found, the corrected doc_type, name, and language replace the default AI prediction in real-time.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export default function TrainingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const userJson = localStorage.getItem("Veralyt_user");
    if (!userJson) { router.push("/"); return; }
    fetchStatus();
    // Cycle through pipeline stages for visual effect
    const interval = setInterval(() => {
      setActiveStage((s) => (s + 1) % PIPELINE_STAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [router]);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${API_BASE_URL}/api/training/status`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || "Failed to load training status.");
      }
    } catch {
      setError("Cannot reach the backend. Ensure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return "—";
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-[#060913]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8 space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-white/5 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all duration-200">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-gradient-to-tr from-blue-600/20 to-purple-500/20 border border-blue-500/20 rounded-xl">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Training Intelligence</h1>
              </div>
              <p className="text-slate-400 text-sm ml-[60px]">
                Continuous learning pipeline — every correction makes the model smarter.
              </p>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {[
            {
              label: "Total Corrections",
              value: status?.total_corrections ?? (loading ? "—" : 0),
              sub: "Human-verified labels",
              icon: CheckCircle,
              color: "text-teal-400",
              glow: "from-teal-500/10",
              border: "border-teal-500/20",
            },
            {
              label: "Model Improvements",
              value: status?.model_improvements ?? (loading ? "—" : 0),
              sub: "Applied continuously",
              icon: TrendingUp,
              color: "text-blue-400",
              glow: "from-blue-500/10",
              border: "border-blue-500/20",
            },
            {
              label: "Learning Status",
              value: status?.learning_active ? "ACTIVE" : "INACTIVE",
              sub: "85% similarity threshold",
              icon: Activity,
              color: status?.learning_active ? "text-emerald-400" : "text-red-400",
              glow: "from-emerald-500/10",
              border: "border-emerald-500/20",
            },
            {
              label: "Pipeline Stages",
              value: "4",
              sub: "Flag → Log → Match → Override",
              icon: Cpu,
              color: "text-purple-400",
              glow: "from-purple-500/10",
              border: "border-purple-500/20",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                variants={{ hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } } }}
              >
                <div className={`relative group overflow-hidden rounded-2xl border ${card.border} bg-slate-950/40 p-6 backdrop-blur-xl hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`absolute -right-4 -top-4 h-24 w-24 bg-gradient-to-br ${card.glow} to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`} />
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.label}</span>
                    <div className={`p-2 rounded-xl bg-white/5 ${card.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className={`text-3xl font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
                  <p className="text-slate-500 text-[11px] mt-1">{card.sub}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Animated Pipeline Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-3xl border border-white/5 bg-slate-900/30 backdrop-blur-xl space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Continuous Learning Pipeline</h2>
            <span className="ml-auto px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full animate-pulse">
              LIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activeStage === idx;
              return (
                <motion.div
                  key={stage.id}
                  animate={isActive ? { scale: 1.03, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`relative p-5 rounded-2xl border transition-all duration-500 cursor-default ${
                    isActive
                      ? `${stage.border} ${stage.bg} shadow-lg`
                      : "border-white/5 bg-slate-950/30"
                  }`}
                >
                  {/* Stage number */}
                  <div className={`absolute -top-3 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                    isActive ? `${stage.border} ${stage.color} bg-slate-950` : "border-white/10 text-slate-600 bg-slate-950"
                  }`}>
                    {stage.id}
                  </div>

                  <div className={`p-2.5 rounded-xl ${stage.bg} ${stage.color} mb-4 w-fit`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className={`text-sm font-bold mb-2 ${isActive ? "text-white" : "text-slate-300"}`}>{stage.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{stage.description}</p>

                  {/* Arrow connector */}
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className={`h-5 w-5 ${isActive ? stage.color : "text-slate-700"} transition-colors duration-300`} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-start gap-3 text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Failed to load training data</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Corrections History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Recent Correction Ledger
            </h2>
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              Last {status?.recent_corrections?.length ?? 0} entries
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl border border-white/5 bg-slate-900/40 animate-pulse" />
              ))}
            </div>
          ) : !status?.recent_corrections || status.recent_corrections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/10 bg-slate-950/20 text-center">
              <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">No corrections yet</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                When you flag an AI error on the Dashboard, the correction will appear here and immediately train the model.
              </p>
              <Link href="/dashboard">
                <button className="mt-6 px-6 py-3 bg-white text-black font-bold text-sm rounded-full hover:bg-slate-200 hover:scale-105 transition-all cursor-pointer">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {status.recent_corrections.map((rec, idx) => (
                  <motion.div
                    key={rec.doc_id + idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    {/* Left: doc info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Original */}
                        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-lg">
                          {rec.original_type || "Unknown"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                        {/* Corrected */}
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-lg">
                          {rec.corrected_type || "Unchanged"}
                        </span>
                      </div>
                      {(rec.original_name || rec.corrected_name) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-slate-500">Name:</span>
                          <span className="text-[11px] text-slate-400 line-through">{rec.original_name || "—"}</span>
                          <ArrowRight className="h-3 w-3 text-slate-600" />
                          <span className="text-[11px] text-white font-semibold">{rec.corrected_name || "—"}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: meta */}
                    <div className="text-right shrink-0 space-y-1">
                      <code className="block text-[10px] font-mono text-slate-600 truncate max-w-[180px]">
                        {rec.doc_id.slice(0, 18)}...
                      </code>
                      <span className="block text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" /> {formatTimestamp(rec.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl border border-blue-500/10 bg-blue-500/5 flex items-start gap-4"
        >
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
            <Brain className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">How Automated Training Works</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Veralyt uses a zero-shot approach: no retraining of neural network weights is needed. Instead, each correction is stored as a labelled example. During the next document analysis, the pipeline computes OCR text similarity using <strong className="text-white">Python difflib</strong>. If the new document's raw text matches a past correction at ≥85%, the human-verified label is applied directly — making every upload smarter in real-time.
            </p>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
