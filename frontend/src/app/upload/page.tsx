"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  Upload, FileText, CheckCircle2, ShieldAlert, ArrowLeft, 
  HelpCircle, Eye, RefreshCw, Layers, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ExtractedFields {
  name?: string;
  document_id?: string;
  doc_type?: string;
  language?: string;
  [key: string]: any;
}

interface AnchoredDocument {
  id: string;
  image_url: string;
  extracted_fields: ExtractedFields;
  content_hash: string;
  created_at: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [overrideType, setOverrideType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [anchoredDoc, setAnchoredDoc] = useState<AnchoredDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Security block state
  const [securityBlocked, setSecurityBlocked] = useState(false);
  const [forgeryDetails, setForgeryDetails] = useState<any | null>(null);
  const [forceAnchor, setForceAnchor] = useState(false);
  const [forceAnchorActive, setForceAnchorActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userJson = localStorage.getItem("Veralyt_user");
    if (!userJson) {
      router.push("/");
      return;
    }
    try {
      const user = JSON.parse(userJson);
      setUserId(user.id);
    } catch (e) {
      router.push("/");
    }
  }, [router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const startAnchorProcess = async () => {
    if (!file || !userId) return;

    setLoading(true);
    setError(null);
    setAnchoredDoc(null);
    setProgress(15);
    setProgressText("Initializing secure channel...");

    // Animate fake progress stages for premium micro-experience
    const timer1 = setTimeout(() => {
      setProgress(40);
      setProgressText("Executing multi-lingual OCR extraction (Hindi/Telugu/Tamil)...");
    }, 1200);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setProgressText("Computing SHA-256 integrity fingerprint & cryptographic signing...");
    }, 2800);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    formData.append("override_type", overrideType);
    if (forceAnchor) {
      formData.append("force_anchor", "true");
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (data.success) {
        setProgress(100);
        setProgressText("Anchored securely in public trust ledger!");
        setTimeout(() => {
          setAnchoredDoc(data.document);
          setLoading(false);
          setForceAnchor(false);
          setForceAnchorActive(false);
        }, 100);
      } else {
        if (data.security_blocked) {
          setSecurityBlocked(true);
          setForgeryDetails(data.forgery);
        } else {
          setError(data.error || "Failed to secure document in ledger.");
        }
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError("Server connection failure. Verify FastAPI is online.");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setOverrideType("");
    setAnchoredDoc(null);
    setError(null);
    setProgress(0);
    setProgressText("");
    setSecurityBlocked(false);
    setForgeryDetails(null);
    setForceAnchor(false);
    setForceAnchorActive(false);
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 bg-[#060913]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        
        {/* Back header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-white/5 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all duration-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Anchor Cryptographic Vault</h1>
            <p className="text-slate-400 text-sm mt-0.5">Secure OCR metadata and register a digital signature in the ledger</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!loading && !anchoredDoc ? (
            securityBlocked && forgeryDetails ? (
              /* Security Block Panel */
              <motion.div
                key="security-block"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-8 rounded-3xl border-2 border-red-500/30 bg-red-950/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.25)] space-y-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-400">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-red-500/20 rounded-xl">
                      <ShieldAlert className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-red-500">CRITICAL SECURITY ALERT: Tampering Detected</h3>
                      <p className="text-red-400/80 text-sm mt-0.5">Forensic indicators suggest this document is fake or tampered.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Threat Level Indicator</h4>
                    <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6 text-center space-y-4">
                      <div className="text-5xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        {forgeryDetails.risk_score}%
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full"
                          style={{ width: `${Math.min(forgeryDetails.risk_score, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-bold text-red-400 uppercase tracking-widest">
                        RISK LEVEL: {forgeryDetails.risk_level}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Forensic Breakdown</h4>
                    <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 space-y-3 h-full">
                      <ul className="space-y-3">
                        {forgeryDetails.details?.map((detail: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                            <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <button
                    onClick={() => {
                      resetForm();
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                  >
                    Cancel & Discard
                  </button>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={forceAnchorActive}
                        onChange={(e) => setForceAnchorActive(e.target.checked)}
                        className="rounded border-white/20 bg-slate-900 text-red-500 focus:ring-red-500/50 cursor-pointer h-4 w-4"
                      />
                      Administrative Bypass
                    </label>
                    <button
                      onClick={() => {
                        setForceAnchor(true);
                        setSecurityBlocked(false);
                        setTimeout(() => startAnchorProcess(), 50);
                      }}
                      disabled={!forceAnchorActive}
                      className="w-full sm:w-auto px-6 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                    >
                      Force Anchor
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
            /* Step 1: Upload Panel */
            <motion.div
              key="upload-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Main Dropper (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`glass-panel p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer min-h-[350px] transition-all duration-300 ${
                    dragActive 
                      ? "border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10" 
                      : "border-white/10 hover:border-white/20 hover:bg-white/[0.01]"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  
                  <div className="p-5 bg-blue-500/10 text-blue-400 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-200">
                    <Upload className="h-8 w-8" />
                  </div>

                  {file ? (
                    <div className="space-y-2">
                      <p className="text-white font-bold text-lg">{file.name}</p>
                      <p className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB &bull; Ready to anchor</p>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-xs text-red-400 hover:underline mt-2 font-semibold"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-sm">
                      <h3 className="text-white font-bold text-lg">Drag & Drop document scan</h3>
                      <p className="text-slate-400 text-sm">
                        Supports Invoice, Aadhaar, Driving License, Marks Card, and other scanned documents (Hindi, Telugu, Tamil & English)
                      </p>
                      <p className="text-xs text-slate-500 pt-3">
                        Maximum file size: 10 MB
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Side Parameters Control (1 col) */}
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl space-y-5 shadow-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <Layers className="h-4.5 w-4.5 text-teal-400" />
                    <span>Anchor Settings</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Force Document Type (Optional)
                    </label>
                    <select
                      value={overrideType}
                      onChange={(e) => setOverrideType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Auto-Detect Category</option>
                      <option value="Invoice">Invoice / Receipt</option>
                      <option value="Aadhaar Card">Aadhaar Card (India)</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Identity Card">Identity ID Card</option>
                      <option value="Report Card">Academic Certificate</option>
                      <option value="Report">Official Report</option>
                      <option value="Other">Custom Document</option>
                    </select>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      By default, Veralyt uses OCR lexical analysis to class types. Override if detection is uncertain.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-2 text-xs text-slate-400 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <HelpCircle className="h-4 w-4 text-blue-400" />
                      <span>Ledger Safeguards</span>
                    </div>
                    <p>
                      Upon anchoring, an ECDSA private key will sign the extracted contents. This binds the original structure, preventing subsequent alterations.
                    </p>
                  </div>

                  <button
                    onClick={startAnchorProcess}
                    disabled={!file}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 transition-all duration-300 border border-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Secure & Anchor</span>
                  </button>
                </div>
              </div>
            </motion.div>
            )
          ) : loading ? (
            /* Step 2: Radial Scanning Progress Circle */
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px] shadow-2xl space-y-6"
            >
              {/* Radial circle animation */}
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    className="text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="52"
                    className="text-blue-500"
                    strokeWidth="8"
                    strokeDasharray={326.7}
                    animate={{ strokeDashoffset: 326.7 - (326.7 * progress) / 100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute font-extrabold text-2xl text-white">{progress}%</div>
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                  <span>Ledger Anchoring in Progress</span>
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{progressText}</p>
              </div>
            </motion.div>
          ) : (
            /* Step 3: Successfully Anchored Card Summary */
            <motion.div
              key="anchored"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel p-8 rounded-3xl shadow-2xl space-y-8"
            >
              
              {/* Success Header banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-emerald-400">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">Document Anchored Successfully!</h3>
                    <p className="text-emerald-400/80 text-sm mt-0.5">Secure trust chain sequence activated for lifetime verification.</p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Anchor Another
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Visual Image Render */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Original Scanned Asset</h4>
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 aspect-[4/3] flex items-center justify-center p-4">
                    {anchoredDoc?.image_url ? (
                      <img 
                        src={anchoredDoc.image_url} 
                        alt="Anchored Vault Document"
                        className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
                      />
                    ) : (
                      <FileText className="h-20 w-20 text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Audit Fields */}
                <div className="space-y-6">
                  
                  {/* Cryptographic block details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ledger Cryptography</h4>
                    <div className="space-y-3.5 bg-slate-950/60 border border-white/5 rounded-2xl p-5 text-xs">
                      <div>
                        <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Internal Vault ID</span>
                        <code className="text-white block mt-0.5 font-mono select-all bg-slate-950 px-2.5 py-1.5 rounded">{anchoredDoc?.id}</code>
                      </div>
                      <div>
                        <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">SHA-256 Digital Fingerprint</span>
                        <code className="text-teal-400 block mt-0.5 font-mono select-all bg-slate-950 px-2.5 py-1.5 rounded">{anchoredDoc?.content_hash}</code>
                      </div>
                    </div>
                  </div>

                  {/* AI Metadata Extraction block */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Forensic OCR Extracted</h4>
                    <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block text-slate-500 font-medium text-[10px]">Identified Category</span>
                          <span className="text-white font-bold text-sm block mt-0.5 capitalize">{anchoredDoc?.extracted_fields?.doc_type || "Unknown"}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-medium text-[10px]">Primary Language</span>
                          <span className="text-teal-400 font-bold text-sm block mt-0.5 capitalize">{anchoredDoc?.extracted_fields?.language || "english"}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Extracted Metadata fields</span>
                        <div className="space-y-2">
                          {anchoredDoc && Object.entries(anchoredDoc.extracted_fields).map(([key, val]) => {
                            if (["doc_type", "language", "raw_text"].includes(key)) return null;
                            return (
                              <div key={key} className="flex justify-between items-center text-xs bg-slate-950 px-3 py-2 rounded-xl">
                                <span className="text-slate-400 capitalize">{key.replace("_", " ")}</span>
                                <span className="text-white font-bold">{String(val)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
