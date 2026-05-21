"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, LayoutDashboard, Upload, Search, LogOut, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem("trustlens_user");
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
    localStorage.removeItem("trustlens_user");
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Anchor Vault", icon: Upload },
    { href: "/verify", label: "Forensic Scan", icon: Search },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4">
      <nav className="mx-auto max-w-7xl glass-panel rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-blue-600 to-teal-400 p-2 rounded-xl shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
              TrustLens
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-teal-400 font-semibold leading-none">
              Forensic Chain
            </span>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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

        {/* Auth details & Logout */}
        <div className="flex items-center gap-4">
          {email && (
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <User className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-medium max-w-[120px] truncate">{email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer shadow-lg shadow-red-500/5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
