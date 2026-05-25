"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, LayoutDashboard, Upload, Search, LogOut, User, Brain, Menu, X, Home } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem("Veralyt_user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setEmail(user.email || "User");
      } catch (e) {
        setEmail("User");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("Veralyt_user");
    router.push("/");
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Anchor Vault", icon: Upload },
    { href: "/verify", label: "Forensic Scan", icon: Search },
    { href: "/training", label: "AI Training", icon: Brain },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 md:px-6 py-4">
      <nav className="mx-auto max-w-7xl glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="bg-gradient-to-tr from-blue-600 to-teal-400 p-2 rounded-xl shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
              Veralyt
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-teal-400 font-semibold leading-none">
              Forensic Chain
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {email && (
            <Link href="/profile" className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
              <User className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-medium max-w-[120px] truncate">{email}</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer shadow-lg shadow-red-500/5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mx-4 mt-2 glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/5">
              {email && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400">
                  <User className="h-3.5 w-3.5 text-teal-400" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
