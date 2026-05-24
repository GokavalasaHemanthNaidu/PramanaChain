"use client";

import Link from "next/link";
import { Shield, Fingerprint, Cpu, ArrowRight, Activity, FileCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden selection:bg-teal-500/30 font-sans">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-[#030712]/50 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-gradient-to-tr from-teal-500 to-blue-500 p-2 rounded-xl shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all duration-300">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:to-white transition-all">
              TrustLens
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/auth"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link 
              href="/auth"
              className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-teal-500/10 via-blue-500/5 to-transparent rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.1)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              TrustLens API v2 is now live
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[1.05]"
            >
              The Ledger of <br />
              <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
                Digital Truth.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Instantly detect deepfakes, block forged IDs, and permanently anchor document integrity on a cryptographic ledger with zero-shot AI.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <Link 
                href="/auth"
                className="w-full sm:w-auto flex justify-center items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 hover:bg-slate-100"
              >
                Anchor Your First Document <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="#features"
                className="w-full sm:w-auto flex justify-center items-center gap-2 bg-slate-900/50 hover:bg-slate-800 border border-white/10 text-white px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 backdrop-blur-md"
              >
                Explore the Tech
              </Link>
            </motion.div>
          </div>

          {/* Interactive Floating Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative w-full max-w-lg mx-auto lg:max-w-none perspective-1000"
          >
            <div className="relative rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-3xl p-6 shadow-2xl shadow-teal-500/10 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-50" />
              
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="text-xs font-mono text-slate-500 bg-slate-950/50 px-3 py-1 rounded-full border border-white/5">
                  live_audit_log.sh
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cryptographic Hash Generated</h4>
                    <code className="text-[10px] text-teal-400 mt-1 block">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Digital Signature Attached</h4>
                    <p className="text-[11px] text-slate-400 mt-1 block">ECDSA mathematical proof applied to ledger.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group-hover:border-red-500/30 transition-colors">
                  <div className="absolute right-0 top-0 h-full w-1 bg-red-500" />
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Deepfake Forensic Scan</h4>
                    <p className="text-[11px] text-red-400 font-medium mt-1 block">WARNING: ELA anomaly detected in uploaded image.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Banner */}
      <section className="py-12 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">Securing documents for</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale">
            {/* Minimal SVG Logos */}
            <h3 className="text-2xl font-black font-sans italic tracking-tighter">AcmeCorp</h3>
            <h3 className="text-xl font-bold font-mono tracking-widest">GLOBEX</h3>
            <h3 className="text-2xl font-extrabold tracking-tight">Soylent</h3>
            <h3 className="text-xl font-medium tracking-[0.2em]">INITRO</h3>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Enterprise-Grade Forensics</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Built for high-security environments, combining visual heuristics with immutable blockchain-inspired cryptography.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 hover:bg-slate-900/80 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 shadow-2xl shadow-transparent hover:shadow-blue-500/10">
              <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-8 group-hover:scale-110 transition-transform">
                <Cpu className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Zero-Shot Extraction</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatically extract names, IDs, and metadata from highly unstructured documents without pre-training models using our advanced vision language integrations.
              </p>
            </div>
            
            <div className="group p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 hover:bg-slate-900/80 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 shadow-2xl shadow-transparent hover:shadow-orange-500/10">
              <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-8 group-hover:scale-110 transition-transform">
                <Activity className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Deepfake Detection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Detects digital tampering, screen recaptures (Moiré patterns), and Error Level Analysis (ELA) anomalies to block fraudulent uploads instantly.
              </p>
            </div>

            <div className="group p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 hover:bg-slate-900/80 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 shadow-2xl shadow-transparent hover:shadow-teal-500/10">
              <div className="h-16 w-16 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 mb-8 group-hover:scale-110 transition-transform">
                <Fingerprint className="h-8 w-8 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">ECDSA Cryptography</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every verified document is digitally signed and anchored to an immutable ledger using SHA-256 and Elliptic Curve Digital Signatures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Footer CTA */}
      <section className="py-32 px-6 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-teal-900/20 via-[#030712] to-[#030712] -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Ready to secure your <br className="hidden md:block" /> digital identity?
          </h2>
          <p className="text-slate-400 text-xl font-medium">Join the platform that defines cryptographic digital truth.</p>
          <Link 
            href="/auth"
            className="inline-flex items-center justify-center gap-2 bg-white text-black px-10 py-5 rounded-full font-extrabold text-base transition-all duration-300 hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            Start Anchoring Free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 py-12 text-center text-slate-500 text-sm font-medium">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-teal-500/50" />
          <span className="text-slate-400 font-bold">TrustLens Forensic Chain</span>
        </div>
        <p>© {new Date().getFullYear()} TrustLens Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
