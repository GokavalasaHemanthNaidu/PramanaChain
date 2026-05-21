"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Password strength state
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: "Very Weak", color: "bg-red-500" });

  // Redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem("trustlens_user");
    if (user) {
      router.push("/dashboard");
    }
  }, [router]);

  // Calculate password strength
  useEffect(() => {
    if (isLogin || !password) {
      setPwdStrength({ score: 0, label: "None", color: "bg-transparent" });
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = "Very Weak";
    let color = "bg-red-500";

    if (score === 2) {
      label = "Weak";
      color = "bg-orange-500";
    } else if (score === 3) {
      label = "Moderate";
      color = "bg-yellow-500";
    } else if (score === 4) {
      label = "Strong";
      color = "bg-green-500";
    }

    setPwdStrength({ score, label, color });
  }, [password, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    const url = `http://127.0.0.1:8000/api/auth/${isLogin ? "login" : "signup"}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setNotification({
          type: "success",
          message: isLogin ? "Login successful! Redirecting..." : "Account created successfully! Switching to Login...",
        });
        
        if (isLogin) {
          localStorage.setItem("trustlens_user", JSON.stringify({ email, id: data.user.id }));
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          setTimeout(() => {
            setIsLogin(true);
            setPassword("");
            setLoading(false);
            setNotification(null);
          }, 1800);
        }
      } else {
        setNotification({
          type: "error",
          message: data.error || "Authentication failed. Please check your credentials.",
        });
        setLoading(false);
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to connect to the backend server. Please verify FastAPI is running.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#060913] overflow-hidden">
      
      {/* Visual Decorative Sidebar (Left) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#0c142c] to-[#040810] border-r border-white/5">
        
        {/* Glow Spheres */}
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-teal-500/10 blur-[100px]" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-gradient-to-tr from-blue-600 to-teal-400 p-2.5 rounded-xl shadow-xl shadow-blue-500/10">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
              TrustLens
            </h1>
            <span className="block text-[10px] uppercase tracking-wider text-teal-400 font-semibold leading-none">
              Forensic Chain
            </span>
          </div>
        </div>

        {/* Dynamic Centerpiece */}
        <div className="my-auto space-y-6 relative z-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            Version 1.5.0 Premium
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Cryptographic Trust & Forgery Forensics
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Protect multi-lingual documents (English, Hindi, Telugu, Tamil) with decentralized digital credentials, SHA-256 integrity fingerprints, and OpenCV Error Level Analysis (ELA).
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
              <h4 className="text-white font-bold text-sm">99.4%</h4>
              <p className="text-slate-400 text-xs mt-0.5">CV Forgery Accuracy</p>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
              <h4 className="text-white font-bold text-sm">Multi-Language</h4>
              <p className="text-slate-400 text-xs mt-0.5">Hindi, Telugu, Tamil</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 relative z-10">
          &copy; {new Date().getFullYear()} TrustLens. Securely built for lifetime usage.
        </p>
      </div>

      {/* Forms Segment (Right) */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 lg:p-16 relative">
        <div className="absolute top-[-5%] left-[-5%] w-[200px] h-[200px] rounded-full bg-purple-600/5 blur-[80px]" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Header Mobile / Title */}
          <div className="text-center lg:text-left space-y-2">
            {/* Logo for mobile */}
            <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6">
              <div className="bg-gradient-to-tr from-blue-600 to-teal-400 p-2 rounded-xl">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
                TrustLens
              </span>
            </div>
            
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {isLogin ? "Welcome back" : "Create secure account"}
            </h2>
            <p className="text-slate-400 text-sm">
              {isLogin ? "Access your secure document vault ledger" : "Register to start anchoring and auditing scans"}
            </p>
          </div>

          {/* Login/Signup Tabs */}
          <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1">
            <button
              onClick={() => { setIsLogin(true); setNotification(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                isLogin ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setNotification(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                !isLogin ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs text-blue-400 hover:underline">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>

              {/* Password strength meter */}
              {!isLogin && password && (
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={`font-bold ${
                      pwdStrength.score <= 1 ? "text-red-400" : pwdStrength.score <= 3 ? "text-yellow-400" : "text-green-400"
                    }`}>{pwdStrength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${pwdStrength.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notification alert banner */}
            <AnimatePresence mode="wait">
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
                    notification.type === "success"
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {notification.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  )}
                  <span>{notification.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-600/10 shadow-md shadow-blue-600/5 mt-6 border border-white/5"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In to Vault" : "Create Secure Account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
