"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  FileText, ShieldAlert, Plus, Globe, FolderOpen, 
  Calendar, Eye, Download, Search, AlertCircle, FileSpreadsheet
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface DocumentItem {
  id: string;
  doc_type: string;
  name: string;
  document_id: string;
  created_at: string;
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

  useEffect(() => {
    const userJson = localStorage.getItem("trustlens_user");
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
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/analytics?user_id=${id}`);
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
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/verify?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setVerifyResult(data.document);
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
        
        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">User Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">Secure document vault and public ledger verification hub</p>
          </div>
          <Link href="/upload">
            <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/10 transition-all duration-300 border border-white/5 cursor-pointer">
              <Plus className="h-5 w-5" />
              <span>Anchor New Document</span>
            </button>
          </Link>
        </div>

        {/* Search & Audit Lookup Bar */}
        <div className="w-full max-w-3xl">
          <form onSubmit={handleVerifySearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Audit Ledger: Enter Document ID, Name, or Hash (Fuzzy Matching Enabled)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {verifyResult && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${
              verifyResult.error 
                ? "bg-red-500/5 border-red-500/20 text-red-400" 
                : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${verifyResult.error ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">
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
                  <p className="text-slate-300 text-sm">{verifyResult.error}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 mt-2">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Document ID</span>
                      <code className="text-white bg-slate-950 px-2 py-0.5 rounded text-[10px] break-all block mt-0.5">{verifyResult.id}</code>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Content Fingerprint (SHA-256)</span>
                      <code className="text-white bg-slate-950 px-2 py-0.5 rounded text-[10px] break-all block mt-0.5">{verifyResult.content_hash}</code>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Extracted Metadata</span>
                      <div className="bg-slate-950 p-2 rounded mt-1 space-y-1">
                        <p><strong>Name:</strong> {verifyResult.extracted_fields?.name || "N/A"}</p>
                        <p><strong>Doc ID:</strong> {verifyResult.extracted_fields?.document_id || "N/A"}</p>
                        <p><strong>Type:</strong> {verifyResult.extracted_fields?.doc_type || "N/A"}</p>
                        <p><strong>Language:</strong> {verifyResult.extracted_fields?.language || "english"}</p>
                      </div>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Cryptographic Chain</span>
                      <div className="bg-slate-950 p-2 rounded mt-1 space-y-1 break-all">
                        <p><strong>DID Public Key:</strong> <code className="text-[9px] text-slate-400">{verifyResult.did_public_key}</code></p>
                        <p><strong>ECDSA Signature:</strong> <code className="text-[9px] text-teal-400">{verifyResult.digital_signature}</code></p>
                        <p className="mt-2 text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 inline" /> Signature mathematically verified with zero forgery detected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Securing connection to the TrustLens ledger...</p>
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
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Total Documents Card */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Anchored</span>
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-4xl font-extrabold text-white">{analytics?.total_documents || 0}</h3>
                  <p className="text-slate-400 text-xs mt-1">Verified secure records in ledger</p>
                </div>
              </div>

              {/* Unique Categories Card */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Document Categories</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-4xl font-extrabold text-white">
                    {analytics ? Object.keys(analytics.categories).length : 0}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Distinct document classes identified</p>
                </div>
              </div>

              {/* Language Distribution Card */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Languages Verified</span>
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                    <Globe className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-4xl font-extrabold text-white">
                    {analytics ? Object.keys(analytics.languages).length : 0}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Hindi, Telugu, Tamil & English</p>
                </div>
              </div>

              {/* Security Health status */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">System Integrity</span>
                  <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-teal-400">100% SECURE</h3>
                  <p className="text-slate-400 text-xs mt-1">DID encryption validation online</p>
                </div>
              </div>

            </div>

            {/* Language and category Visual bars (Clean Custom Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category Breakdown list */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Category Distribution</h3>
                <div className="space-y-3.5">
                  {analytics && Object.keys(analytics.categories).length > 0 ? (
                    Object.entries(analytics.categories).map(([cat, count]) => {
                      const percentage = analytics.total_documents > 0 ? (count / analytics.total_documents) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-300 capitalize">{cat}</span>
                            <span className="text-slate-400">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-xs italic py-4">No anchored records to map category metrics.</p>
                  )}
                </div>
              </div>

              {/* Language distribution list */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Language Distribution</h3>
                <div className="space-y-3.5">
                  {analytics && Object.keys(analytics.languages).length > 0 ? (
                    Object.entries(analytics.languages).map(([lang, count]) => {
                      const percentage = analytics.total_documents > 0 ? (count / analytics.total_documents) * 100 : 0;
                      return (
                        <div key={lang} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-300 capitalize">{lang}</span>
                            <span className="text-slate-400">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-xs italic py-4">No anchored records to map language metrics.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Document Ledger Table */}
            <div className="glass-panel rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Document Trust Ledger</h3>
                <span className="px-2.5 py-1 bg-white/5 border border-white/5 text-slate-400 rounded-lg text-xs font-medium">
                  {analytics?.documents.length || 0} Anchored
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Document Details</th>
                      <th className="px-6 py-4">Document ID</th>
                      <th className="px-6 py-4">Anchored Date</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Ledger Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {analytics && analytics.documents.length > 0 ? (
                      analytics.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                          <td className="px-6 py-4 font-semibold text-white">
                            {doc.name || "Unnamed Document"}
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-slate-950/80 px-2 py-1 rounded text-teal-400 border border-teal-500/10">
                              {doc.document_id || "N/A"}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-400">
                            {doc.created_at || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${getDocBadgeColor(doc.doc_type)}`}>
                              {doc.doc_type || "Other"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSearchQuery(doc.id);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Audit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                          No documents anchored yet. Go to "Anchor Vault" to secure your first document!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
