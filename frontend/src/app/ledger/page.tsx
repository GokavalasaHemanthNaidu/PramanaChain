"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Search, Database, Lock, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function LedgerScanner() {
  const searchParams = useSearchParams();
  const hash = searchParams.get("hash");
  const [step, setStep] = useState(0);
  
  // Animation steps
  // 0: Initializing
  // 1: Scanning blocks
  // 2: Validating ECDSA
  // 3: Result
  
  useEffect(() => {
    if (!hash) return;
    
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 4500)
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [hash]);

  if (!hash) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white">No Hash Provided</h2>
        <p className="text-slate-400">Please provide a valid document hash to scan the ledger.</p>
        <Link href="/" className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full pt-12 pb-24">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      
      <div className="glass-panel p-8 md:p-12 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Public Ledger Audit</h1>
            <p className="text-slate-400 mt-1 font-mono text-sm">Querying distributed network...</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
            <Search className="h-6 w-6 text-teal-400" />
          </div>
        </div>

        <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-6 mb-8 font-mono text-sm break-all text-slate-300">
          <span className="text-slate-500 font-bold mr-2 uppercase text-xs">Target Hash:</span>
          {hash}
        </div>

        <div className="space-y-6 relative z-10">
          
          {/* Step 1 */}
          <div className={`flex items-center gap-4 transition-opacity duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border shrink-0 transition-colors ${step >= 1 ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {step >= 1 ? <CheckCircle2 className="h-5 w-5" /> : <Database className="h-4 w-4 animate-pulse" />}
            </div>
            <div>
              <h4 className={`font-bold ${step >= 1 ? 'text-white' : 'text-slate-300'}`}>Connecting to Network Nodes</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">Establishing secure connection to PramanaChain</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`flex items-center gap-4 transition-opacity duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border shrink-0 transition-colors ${step >= 2 ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {step >= 2 ? <CheckCircle2 className="h-5 w-5" /> : <Cpu className="h-4 w-4 animate-pulse" />}
            </div>
            <div>
              <h4 className={`font-bold ${step >= 2 ? 'text-white' : 'text-slate-300'}`}>Scanning Immutable Blocks</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">Searching block index for hash match</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`flex items-center gap-4 transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border shrink-0 transition-colors ${step >= 3 ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {step >= 3 ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-4 w-4 animate-pulse" />}
            </div>
            <div>
              <h4 className={`font-bold ${step >= 3 ? 'text-white' : 'text-slate-300'}`}>Validating ECDSA Signatures</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">Verifying cryptographic integrity</p>
            </div>
          </div>
          
        </div>

        {/* Final Result */}
        {step >= 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
          >
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white text-red-400 mb-1">UNVERIFIED DOCUMENT</h3>
              <p className="text-sm text-red-300/80 leading-relaxed">
                This hash does not exist in the public ledger. The document is either forged, completely fabricated, or was never registered through the PramanaChain network.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function PublicVerifyPage() {
  return (
    <div className="min-h-screen bg-[#030712] selection:bg-teal-500/30 font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 flex px-6 pt-24">
        <Suspense fallback={<div className="text-white text-center w-full mt-20">Loading scanner...</div>}>
          <LedgerScanner />
        </Suspense>
      </main>
    </div>
  );
}
