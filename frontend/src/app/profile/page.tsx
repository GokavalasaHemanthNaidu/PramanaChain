"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Shield, Key, Bell, Settings, LogOut, FileText, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [stats, setStats] = useState({ total_documents: 0 });
  const [loading, setLoading] = useState(true);

  // Mock settings state
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem("Veralyt_user");
    if (!userJson) {
      router.push("/auth");
      return;
    }

    try {
      const parsedUser = JSON.parse(userJson);
      setUser(parsedUser);
      fetchAnalytics(parsedUser.id);
    } catch (e) {
      router.push("/auth");
    }
  }, [router]);

  const fetchAnalytics = async (id: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_BASE_URL}/api/analytics?user_id=${id}`);
      const data = await response.json();
      if (data.success) {
        setStats({ total_documents: data.total_documents || 0 });
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("Veralyt_user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 p-6 md:p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
            Account Profile
          </h1>
          <p className="text-slate-400">Manage your security settings and account details.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 space-y-6"
          >
            <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-24 h-24" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-tr from-blue-600/20 to-teal-400/20 border border-blue-500/30 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
                  <User className="w-10 h-10 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-white truncate w-full px-2" title={user?.email}>
                  {user?.email}
                </h2>
                <p className="text-sm text-slate-400 mt-1">Veralyt Member</p>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Account Active
                </div>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-white/5 relative z-10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">User ID</span>
                  <span className="text-slate-200 font-mono truncate w-24" title={user?.id}>
                    {user?.id?.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Plan</span>
                  <span className="text-blue-400 font-medium">Free Tier</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full glass-panel flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 font-medium border border-red-500/20 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Securely
            </button>
          </motion.div>

          {/* Right Column: Stats & Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Documents Anchored</p>
                  <p className="text-2xl font-bold text-white">{stats.total_documents}</p>
                </div>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Trust Score</p>
                  <p className="text-2xl font-bold text-white">100%</p>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Security Preferences
                </h3>
              </div>
              <div className="p-5 space-y-6">
                
                {/* 2FA Toggle */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                      <Key className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-400">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      twoFactor ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        twoFactor ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                      <Bell className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">Login Alerts</p>
                      <p className="text-sm text-slate-400">Get notified when someone logs into your account.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      emailAlerts ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailAlerts ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Password Change (Mock) */}
                <div className="pt-4 border-t border-white/5">
                  <button className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                    Update Password →
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
