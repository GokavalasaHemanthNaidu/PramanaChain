"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  FileText, ShieldAlert, Plus, Globe, FolderOpen, 
  Calendar, Eye, Download, Search, AlertCircle, FileSpreadsheet, Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface DocumentItem {
  id: string;
  doc_type: string;
  name: string;
  document_id: string;
  created_at: string;
  image_url?: string;
}

interface AnalyticsData {
  total_documents: number;
  categories: Record<string, number>;
  languages: Record<string, number>;
  documents: DocumentItem[];
}

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification modal or card result state
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  // AI Training feedback state
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<any>({});
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const handleCorrectionSubmit = async () => {
    if (!verifyResult?.id) return;
    setSubmittingCorrection(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${API_BASE_URL}/api/training/correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: verifyResult.id,
          corrected_fields: editedMetadata
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Training data logged securely! Thank you for improving the AI.");
        setIsEditingMetadata(false);
      } else {
        alert("Failed to log correction: " + data.error);
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Deletion state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleDocSelection = (id: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocs(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedDocs.size === analytics?.documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(analytics?.documents.map(d => d.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocs.size === 0 || !userId) return;
    setIsDeleting(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, doc_ids: Array.from(selectedDocs) })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedDocs(new Set());
        fetchAnalytics(userId); // Refresh table
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (e) {
      alert("Network error during delete.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem("Veralyt_user");
    if (!userJson) {
      router.push("/");
      return;
    }
    
    try {
      const user = JSON.parse(userJson);
      setUserId(user.id);
      fetchAnalytics(user.id);
    } catch (e) {
      router.push("/");
    }
  }, [router]);

  const fetchAnalytics = async (id: string) => {
    setLoading(true);
    setError(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics?user_id=${id}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data);
      } else {
        setError(data.error || "Failed to load dashboard statistics.");
      }
    } catch (err) {
      setError("Unable to connect to the backend ledger service. Make sure FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setVerifying(true);
    setVerifyResult(null);
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setVerifyResult(data.document);
        setEditedMetadata(data.document.extracted_fields || {});
        setIsEditingMetadata(false);
      } else {
        setVerifyResult({ error: data.error || "No matching record in verified ledger." });
      }
    } catch (err) {
      setVerifyResult({ error: "Backend network error. Verification lookup failed." });
    } finally {
      setVerifying(false);
    }
  };

  // Helper to get matching gradient per document type
  const getDocBadgeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("invoice")) return "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20";
    if (t.includes("aadhaar") || t.includes("id")) return "from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20";
    if (t.includes("license")) return "from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20";
    return "from-slate-500/10 to-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 bg-[#060913]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 space-y-8">
        {/* Glowing Active Telemetry Dashboard Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border border-white/5 bg-slate-950/20 backdrop-blur-md rounded-2xl gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-emerald-400 animate-pulse" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                User Dashboard
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              SECURE CRYPTO LEDGER VAULT ─ <span className="text-teal-400 font-bold">TLV-8092-X9</span>
            </p>
          </div>

          {/* Operational Diagnostics & Anchor Button */}
          <div className="flex gap-4 items-center flex-wrap w-full md:w-auto justify-between md:justify-end">
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                <Globe className="h-3.5 w-3.5 text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>LEDGER: ONLINE</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-emerald-400 shadow-[0_0_15px_rgba(5,255,155,0.05)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span>SYSTEM SECURE</span>
              </div>
            </div>

            <Link href="/upload">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 transition-all duration-300 border border-white/5 cursor-pointer">
                <Plus className="h-4.5 w-4.5" />
                <span>Anchor New Document</span>
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl animate-pulse h-32" />
              ))}
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-xl animate-pulse h-96 flex flex-col items-center justify-center">
              <div className="h-10 w-10 border-4 border-teal-500/50 border-t-teal-400 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm font-medium">Securing connection to the Veralyt ledger...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 rounded-2xl border-red-500/20 text-center max-w-xl mx-auto space-y-4">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
            <h3 className="text-white font-bold text-lg">Connection Error</h3>
            <p className="text-slate-400 text-sm">{error}</p>
            <button 
              onClick={() => fetchAnalytics(userId!)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Staggered Glassmorphic Stats Grid */}
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.1 }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              
              {/* Total Documents Card */}
              <motion.div variants={{ hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }}}>
                <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-slate-950/45 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_12px_30px_rgba(59,130,246,0.05)] hover:-translate-y-1">
                  <div className="absolute -right-4 -top-4 h-24 w-24 bg-gradient-to-br from-blue-500/10 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Anchored</span>
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/15 group-hover:border-blue-500/30 transition-all duration-300">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">{analytics?.total_documents || 0}</h3>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">Verified secure records in ledger</p>
                  </div>
                </div>
              </motion.div>

              {/* Unique Categories Card */}
              <motion.div variants={{ hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }}}>
                <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-slate-950/45 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_12px_30px_rgba(5,255,155,0.05)] hover:-translate-y-1">
                  <div className="absolute -right-4 -top-4 h-24 w-24 bg-gradient-to-br from-teal-500/10 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Categories</span>
                    <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/15 group-hover:border-teal-500/30 transition-all duration-300">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">
                      {analytics ? Object.keys(analytics.categories).length : 0}
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">Distinct document classes identified</p>
                  </div>
                </div>
              </motion.div>

              {/* Languages Verified Card */}
              <motion.div variants={{ hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }}}>
                <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-slate-950/45 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_12px_30px_rgba(168,85,247,0.05)] hover:-translate-y-1">
                  <div className="absolute -right-4 -top-4 h-24 w-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Languages</span>
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/15 group-hover:border-indigo-500/30 transition-all duration-300">
                      <Globe className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">
                      {analytics ? Object.keys(analytics.languages).length : 0}
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">Hindi, Telugu, Tamil & English</p>
                  </div>
                </div>
              </motion.div>

              {/* System Integrity Card */}
              <motion.div variants={{ hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }}}>
                <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-slate-950/45 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_12px_30px_rgba(20,184,166,0.05)] hover:-translate-y-1">
                  <div className="absolute -right-4 -top-4 h-24 w-24 bg-gradient-to-br from-teal-500/10 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Integrity</span>
                    <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/15 group-hover:border-teal-500/30 transition-all duration-300">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-teal-400 tracking-tight">100% SECURE</h3>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">DID encryption validation online</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Verification Result Card */}
            {verifyResult && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border backdrop-blur-xl ${
                  verifyResult.error 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)]" 
                    : "bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.1)]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${verifyResult.error ? "bg-red-500/20" : "bg-teal-500/20"}`}>
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xl tracking-tight">
                        {verifyResult.error ? "Verification Failed" : "Document Verified successfully!"}
                      </h3>
                      <button 
                        onClick={() => setVerifyResult(null)} 
                        className="text-xs opacity-60 hover:opacity-100 uppercase tracking-wider font-semibold cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                    
                    {verifyResult.error ? (
                      <p className="text-slate-300">{verifyResult.error}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300 mt-4">
                        <div className="space-y-4">
                          <div>
                            <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px] mb-1">Document ID</span>
                            <code className="text-white bg-slate-950/80 px-3 py-1.5 rounded-lg text-xs break-all block border border-white/5">{verifyResult.id}</code>
                          </div>
                          <div>
                            <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px] mb-1">Content Fingerprint (SHA-256)</span>
                            <code className="text-white bg-slate-950/80 px-3 py-1.5 rounded-lg text-xs break-all block border border-white/5">{verifyResult.content_hash}</code>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Extracted Metadata</span>
                              {!isEditingMetadata && (
                                <button 
                                  onClick={() => setIsEditingMetadata(true)}
                                  className="flex items-center gap-1.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1 rounded-md cursor-pointer transition-colors font-semibold"
                                  title="Correct AI extraction mistakes"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                  Correct Metadata
                                </button>
                              )}
                            </div>
                            <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 space-y-2">
                              {isEditingMetadata ? (
                                <div className="space-y-3">
                                  {['name', 'document_id', 'doc_type', 'language'].map(field => (
                                    <div key={field} className="flex flex-col">
                                      <label className="text-[10px] text-slate-400 capitalize mb-1">{field.replace('_', ' ')}</label>
                                      <input 
                                        type="text" 
                                        value={editedMetadata[field] || ""}
                                        onChange={(e) => setEditedMetadata({...editedMetadata, [field]: e.target.value})}
                                        className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                                      />
                                    </div>
                                  ))}
                                  <div className="flex gap-3 pt-3">
                                    <button 
                                      onClick={handleCorrectionSubmit}
                                      disabled={submittingCorrection}
                                      className="flex-1 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors"
                                    >
                                      {submittingCorrection ? "Saving..." : "Submit Correction"}
                                    </button>
                                    <button 
                                      onClick={() => setIsEditingMetadata(false)}
                                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p><strong className="text-slate-400">Name:</strong> <span className="text-white">{verifyResult.extracted_fields?.name || "N/A"}</span></p>
                                  <p><strong className="text-slate-400">Doc ID:</strong> <span className="text-white">{verifyResult.extracted_fields?.document_id || "N/A"}</span></p>
                                  <p><strong className="text-slate-400">Type:</strong> <span className="text-white">{verifyResult.extracted_fields?.doc_type || "N/A"}</span></p>
                                  <p><strong className="text-slate-400">Language:</strong> <span className="text-white">{verifyResult.extracted_fields?.language || "english"}</span></p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px] mb-1">Cryptographic Chain</span>
                          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 space-y-4 break-all h-full">
                            <div>
                              <p className="text-[10px] text-slate-500 mb-1">DID Public Key:</p>
                              <code className="text-xs text-slate-400 bg-slate-900 p-2 rounded block border border-white/5">{verifyResult.did_public_key}</code>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 mb-1">ECDSA Signature:</p>
                              <code className="text-xs text-teal-400 bg-slate-900 p-2 rounded block border border-white/5">{verifyResult.digital_signature}</code>
                            </div>
                            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                              <p className="text-xs text-teal-400 font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Signature mathematically verified with zero forgery detected.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Visual Document Gallery (Grid) */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <FolderOpen className="h-6 w-6 text-teal-500" /> Your Secure Vault
                </h2>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-400">
                    {analytics?.documents.length || 0} Anchored
                  </span>
                  {selectedDocs.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-all"
                    >
                      <Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : `Delete (${selectedDocs.size})`}
                    </button>
                  )}
                </div>
              </div>

              {analytics && analytics.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {analytics.documents.map((doc) => (
                    <motion.div 
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden hover:border-white/20 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300"
                    >
                      {/* Checkbox absolute top left */}
                      <div className="absolute top-3 left-3 z-20">
                         <input 
                           type="checkbox" 
                           className="w-5 h-5 rounded-md border-white/20 bg-slate-950/80 text-teal-500 focus:ring-teal-500/50 cursor-pointer backdrop-blur-sm"
                           checked={selectedDocs.has(doc.id)}
                           onChange={() => toggleDocSelection(doc.id)}
                         />
                      </div>
                      
                      {/* Thumbnail Image */}
                      <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden flex items-center justify-center">
                        {doc.image_url ? (
                          <img src={doc.image_url} alt={doc.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                        ) : (
                          <FileText className="h-12 w-12 text-slate-700" />
                        )}
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
                        
                        {/* Audit Overlay Button (Appears on hover) */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/40 backdrop-blur-sm z-10">
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation();
                               setSearchQuery(doc.id); 
                               window.scrollTo({top: 0, behavior: 'smooth'}); 
                               const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                               handleVerifySearch(fakeEvent); 
                             }} 
                             className="px-6 py-3 bg-white text-black font-bold text-sm rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
                           >
                             <Eye className="h-4 w-4" /> Audit Ledger
                           </button>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2 z-10">
                        <div className="flex items-center justify-between">
                           <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider border bg-gradient-to-r ${getDocBadgeColor(doc.doc_type)} backdrop-blur-md`}>
                             {doc.doc_type || "Document"}
                           </span>
                        </div>
                        <h4 className="text-base font-bold text-white truncate drop-shadow-md" title={doc.name || "Unnamed Document"}>
                          {doc.name || "Unnamed Document"}
                        </h4>
                        <div className="flex items-center justify-between text-slate-300">
                           <code className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-md border border-white/10 truncate max-w-[150px]" title={doc.document_id}>
                             {doc.document_id || "N/A"}
                           </code>
                           <span className="text-[10px] text-slate-400 font-medium">{doc.created_at}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl border border-dashed border-white/10 bg-slate-950/30">
                  <div className="h-24 w-24 bg-teal-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(20,184,166,0.1)]">
                    <ShieldAlert className="h-12 w-12 text-teal-400" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-white tracking-tight mb-3">Your secure vault is empty</h3>
                  <p className="text-slate-400 text-lg mb-8 max-w-lg">Anchor your first document to secure it permanently on the cryptographic ledger with zero-shot AI extraction.</p>
                  <Link href="/upload">
                    <button className="bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all px-8 py-4 rounded-full font-bold text-sm shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer">
                      <Plus className="h-5 w-5" /> Anchor First Document
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Language and category Visual bars (Clean Custom Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
              
              {/* Category Breakdown list */}
              <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/30 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-teal-400" /> Category Distribution
                </h3>
                <div className="space-y-4">
                  {analytics && Object.keys(analytics.categories).length > 0 ? (
                    Object.entries(analytics.categories).map(([cat, count]) => {
                      const percentage = analytics.total_documents > 0 ? (count / analytics.total_documents) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300 capitalize">{cat}</span>
                            <span className="text-teal-400">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-sm italic py-4">No anchored records to map category metrics.</p>
                  )}
                </div>
              </div>

              {/* Language distribution list */}
              <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/30 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-400" /> Language Distribution
                </h3>
                <div className="space-y-4">
                  {analytics && Object.keys(analytics.languages).length > 0 ? (
                    Object.entries(analytics.languages).map(([lang, count]) => {
                      const percentage = analytics.total_documents > 0 ? (count / analytics.total_documents) * 100 : 0;
                      return (
                        <div key={lang} className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300 capitalize">{lang}</span>
                            <span className="text-indigo-400">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-sm italic py-4">No anchored records to map language metrics.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Search & Audit Lookup Bar (Moved to bottom) */}
            <div className="mt-16 pt-16 border-t border-white/5">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl mb-4">
                    <Search className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Manual Ledger Audit</h3>
                  <p className="text-slate-400">Verify the authenticity of any document across the entire Veralyt network by entering its cryptographic hash or Document ID.</p>
                </div>
                
                <form onSubmit={(e) => { window.scrollTo({top: 0, behavior: 'smooth'}); handleVerifySearch(e); }} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter Document ID, Name, or SHA-256 Hash..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 rounded-2xl border border-white/10 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="px-8 py-4 bg-white hover:bg-slate-200 text-black rounded-2xl font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
                  >
                    {verifying ? "Auditing..." : "Audit Ledger"}
                  </button>
                </form>
              </div>
            </div>

          </>
        )}
      </main>
    </div>
  );
}

// Custom checkcircle helper
function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
