"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  User,
  ListOrdered,
  Download,
  Upload,
  LogOut,
  Bell,
  Crown,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Gem,
  Wallet,
  Zap,
  ArrowLeftRight,
  UserPlus,
  BanknoteArrowUp,
  HeartHandshake,
  ShieldQuestionMark,
  Gamepad2,
  Plus,
  Volume2,
  VolumeX,
  History,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserStore } from "@/store/userStore";

export default function UltraPremiumHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [activeHover, setActiveHover] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);            // NEW: notification modal
  const [notices, setNotices] = useState([]);                   // NEW: notices list
  const [growthRate, setGrowthRate] = useState(0);              // NEW: IncreaseGrowth rate

  const pathname = usePathname();
  const router = useRouter();
  const clearEmail = useUserStore((s) => s.clear);
  const email = useUserStore((s) => s.email);

  const [headerUser, setHeaderUser] = useState({
    name: "Guest",
    role: "user",
    currency: "BDT",
    wallet: { main: 0, bonus: 0, referral: 0, bank: { amount: 0, requestTime: null, validTransferTime: null } },
    notifications: 0,
  });
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5);
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w < 1024);
    };
    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // NEW: bank amount calculator (pro-rated up to 24h)
  const calcBankAmount = useCallback((amount, requestTime, ratePct) => {
    const base = Number(amount || 0);
    if (!requestTime || !ratePct || base <= 0) return base;

    const sinceMs = Date.now() - new Date(requestTime).getTime();
    const hours = Math.max(0, sinceMs / 3600000);
    const fraction = Math.min(hours / 24, 1); // cap at 24h
    const inc = base * (Number(ratePct) / 100) * fraction;
    return base + inc;
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!email) return;
    setLoadingBalances(true);
    try {
      const res = await fetch("/api/nav-balance-get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json?.success) {
        const d = json.data;
        const bank = d?.wallet?.bank || {};
        setGrowthRate(Number(d?.growthRate || 0));   // NEW
        setNotices(Array.isArray(d?.notices) ? d.notices : []); // NEW

        setHeaderUser({
          name: d.fullName || "User",
          role: d.role || "user",
          currency: d.currency || "BDT",
          wallet: {
            main: Number(d.wallet?.main ?? 0),
            bonus: Number(d.wallet?.bonus ?? 0),
            referral: Number(d.wallet?.referral ?? 0),
            bank: {
              amount: Number(bank?.amount ?? 0),
              requestTime: bank?.requestTime || null,
              validTransferTime: bank?.validTransferTime || null,
            },
          },
          notifications: (d?.notices?.length ?? 0), // NEW: dynamic count
        });
      } else {
        toast.error(json?.message || "Profile not found", {
          position: "top-center",
        });
      }
    } catch {
      toast.error("Failed to load balances", { position: "top-center" });
    } finally {
      setLoadingBalances(false);
    }
  }, [email]);

  useEffect(() => {
    if (menuOpen) fetchBalances();
  }, [menuOpen, fetchBalances]);
  useEffect(() => {
    if (isMobile && email) fetchBalances();
  }, [isMobile, email, fetchBalances]);

  const navItems = useMemo(
    () => [
      { label: "Home", href: "/users/home", icon: Home, grad: "from-green-400 to-cyan-400" },
      { label: "Profile", href: "/users/profile", icon: User, grad: "from-yellow-400 to-orange-400" },
      { label: "Referral", href: "/users/referral", icon: UserPlus, grad: "from-purple-400 to-pink-400" },
      { label: "Transactions", href: "/users/transaction", icon: ListOrdered, grad: "from-blue-400 to-cyan-400" },
      { label: "History", href: "/users/history", icon: History, grad: "from-teal-400 to-teal-500" },
      { label: "Deposit", href: "/users/diposit", icon: Download, grad: "from-emerald-400 to-green-400" },
      { label: "Withdraw", href: "/users/withdraw", icon: Upload, grad: "from-orange-400 to-red-400" },
      { label: "Transfer Balance", href: "/users/transfer", icon: ArrowLeftRight, grad: "from-green-400 to-cyan-400", isNew: true },
      { label: "Bank", href: "/users/bank", icon: BanknoteArrowUp, grad: "from-green-400 to-cyan-400", isNew: true },
    ],
    []
  );

  const quickActions = useMemo(
    () => [
      { label: "Help", icon: HeartHandshake, href: "/users/deposit", color: "from-emerald-400 to-cyan-400" },
      { label: "About", icon: ShieldQuestionMark, href: "/users/withdraw", color: "from-orange-400 to-red-400" },
      { label: "Roles", icon: Gamepad2, href: "/users/referral", color: "from-purple-400 to-pink-400" },
    ],
    []
  );

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const res = await fetch("/api/sign-out", { method: "POST" });
      if (!res.ok) throw new Error("Failed to sign out");
      try { clearEmail?.(); } catch {}
      try { localStorage.removeItem("role-store"); } catch {}
      toast.success("Signed out successfully ✅", { position: "top-center" });
      setMenuOpen(false);
      setTimeout(() => router.replace("/users/sign-in"), 900);
    } catch {
      toast.error("Sign out failed. Try again ❌", { position: "top-center" });
    } finally {
      setSigningOut(false);
    }
  };

  const formatMoney = (n) =>
    `${headerUser.currency} ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  // NEW: computed bank display (pro-rated by growthRate)
  const bankDisplay = useMemo(() => {
    const b = headerUser?.wallet?.bank || {};
    return calcBankAmount(b.amount, b.requestTime, growthRate);
  }, [headerUser?.wallet?.bank, growthRate, calcBankAmount]);

  // --- UI ---
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        toastClassName="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 shadow-2xl"
      />

      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] }}
        className={`fixed top-0 z-50 w-full transition-all duration-700 ${
          scrolled
            ? "bg-slate-900/98 backdrop-blur-3xl border-b border-white/20 shadow-2xl shadow-blue-500/30"
            : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-white/15"
        }`}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-violet-600/20 via-fuchsia-600/15 to-cyan-600/20"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 200%" }}
        />

        <div className="absolute inset-0 opacity-35 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-cyan-400/60 to-blue-400/60"
              initial={{ x: `${(i * 23 + 7) % 100}%`, y: `${(i * 31 + 11) % 100}%`, scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.3, 0],
                opacity: [0, 0.8, 0],
                x: [`${(i * 23 + 7) % 100}%`, `${(i * 29 + 37) % 100}%`],
                y: [`${(i * 31 + 11) % 100}%`, `${(i * 19 + 73) % 100}%`],
              }}
              transition={{ duration: 7 + i, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
              style={{ width: 6 + i * 2, height: 6 + i * 2 }}
            />
          ))}
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center ">
            {/* LEFT: Brand */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center space-x-3 sm:space-x-4 group"
              onClick={() => router.push("/users/home")}
              aria-label="Go to Home"
            >
              <div className="relative hidden md:block">
                <motion.div
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/40"
                  whileHover={{ rotate: 12, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Gem className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                </motion.div>
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 rounded-2xl blur-xl opacity-40"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
                  CRAZY RAFEL
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-cyan-300/80 tracking-widest">
                  World Wide Game
                </span>
              </div>
            </motion.button>

            {/* CENTER (mobile): main balance card with inline + */}
            <div className="flex-1 flex justify-center md:hidden px-2">
              <div className="pr-[4px] pl-3 bg-white/5 rounded-full  ring-1 ring-white/40 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-white">
                  {loadingBalances ? "BDT 0" : formatMoney(headerUser.wallet.main)}
                </span>
                <button
                  onClick={() => router.push("/users/diposit")}
                  className=" grid place-items-center rounded-full my-[3px]  text-white bg-green-400 w-5 h-5 ring-1 ring-white/20 active:scale-95"
                  aria-label="Deposit"
                  title="Deposit"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* RIGHT: controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Combined Balance + Deposit (Desktop) */}
              <button
                onClick={() => router.push("/users/deposit")}
                className="hidden md:flex items-center gap-3 rounded-2xl pl-3 pr-2 py-2 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition group"
                aria-label="Deposit"
                title="Deposit"
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] text-white/60">Balance</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatMoney(headerUser.wallet.main)}
                  </span>
                </div>
                <span className="ml-2 grid place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-white ring-1 ring-white/15 w-8 h-8 group-hover:brightness-110">
                  <Plus className="w-4 h-4" />
                </span>
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMuted((v) => !v)}
                className="hidden sm:inline-flex p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
              </motion.button>

              {/* NEW: Notification button (clickable) */}
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                {headerUser.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold border-2 border-slate-900">
                    {headerUser.notifications}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen(true)}
                className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center justify-center gap-2 mt-3">
            {navItems
              .filter((n) => !n.hiddenDesktop)
              .slice(0, isTablet ? 5 : 7)
              .map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setActiveHover(item.href)}
                    onHoverEnd={() => setActiveHover(null)}
                  >
                    <Link
                      href={item.href}
                      className={`relative px-4 py-3 rounded-2xl font-semibold min-w-[150px] text-center ring-1 transition ${
                        isActive
                          ? `text-white bg-gradient-to-r ${item.grad} ring-white/20 shadow-[0_8px_30px_-12px_rgba(99,102,241,.45)]`
                          : "text-white/85 bg-white/5 hover:bg-white/10 ring-white/10 hover:text-white"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{item.label}</span>
                      </span>

                      {item.isNew && (
                        <span className="absolute -top-2 -right-3 px-2 py-1 text-[6px] font-black rounded-full bg-gradient-to-b from-emerald-300 to-emerald-600 text-white shadow-2xl shadow-emerald-500/50 border-b-4 border-emerald-700 uppercase tracking-widest transform transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/60">
                          <span className="drop-shadow-md">NEW</span>
                          <div className="absolute -inset-1 rounded-full bg-emerald-400/20 blur-md" />
                        </span>
                      )}

                      {activeHover === item.href && !isActive && <span className="absolute inset-0 rounded-2xl bg-white/5" />}
                      {isActive && (
                        <span className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-full bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
          </nav>
        </div>
      </motion.header>

      {/* spacer */}
      <div className="h-16 sm:h-20 lg:h-28" />

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-3xl"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="absolute right-0 top-0 h-full w-full sm:w-96 max-w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-l border-white/20 luxury-scroll"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header user meta */}
              <div className="p-6 sm:p-8 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl grid place-items-center">
                      <User className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-base sm:text-lg">{headerUser.name}</span>
                      <span className="text-cyan-300 flex items-center text-xs sm:text-sm">
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {headerUser.role}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
                    aria-label="Close"
                  >
                    <X className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>

                {/* FOUR BALANCE CARDS */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Main", value: headerUser.wallet.main, grad: "from-emerald-500/20 to-teal-500/20", ring: "ring-green-400" },
                    { label: "Bonus", value: headerUser.wallet.bonus, grad: "from-violet-500/20 to-fuchsia-500/20", ring: "ring-violet-400" },
                    { label: "Referral", value: headerUser.wallet.referral, grad: "from-cyan-500/20 to-blue-500/20", ring: "ring-cyan-400" },
                    // NEW: Bank uses computed display
                    { label: "Bank", value: bankDisplay, grad: "from-yellow-500/20 to-yellow-600/40", ring: "ring-yellow-400" },
                  ].map((b) => (
                    <div key={b.label} className={`p-2 rounded-md  sm:rounded-2xl bg-gradient-to-br ${b.grad} ring-1 ${b.ring}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/80 text-xs">{b.label}</span>
                        <Zap className="text-cyan-300 w-3.5 h-3.5" />
                      </div>
                      <div className="text-[8px] sm:text-base font-bold text-white truncate">
                        {loadingBalances ? "Loading…" : formatMoney(b.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NAV LINKS (mobile) */}
              <div className="p-4 sm:p-6 h-[calc(100vh-200px)] overflow-y-auto luxury-scroll">
                <nav className="space-y-2 sm:space-y-3">
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <motion.div key={item.href} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.08 + index * 0.03 }}>
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={`relative flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl ring-1 transition ${
                            isActive ? `bg-gradient-to-r ${item.grad} text-white ring-white/20` : "bg-white/5 hover:bg-white/10 text-white/85 ring-white/10"
                          }`}
                        >
                          <span className="flex items-center space-x-3 sm:space-x-4">
                            <span className="p-2 rounded-lg bg-white/10">
                              <Icon className="w-4 h-4" />
                            </span>
                            <span className="font-semibold text-sm sm:text-base">{item.label}</span>
                          </span>
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/60" />
                          {item.isNew && (
                            <motion.span
                              className="absolute top-5 right-8 px-2 py-1 text-[6px] font-black rounded-full bg-gradient-to-r from-green-500 to-teal-700 text-white shadow-2xl shadow-cyan-500/50 border border-cyan-300/50 uppercase tracking-widest backdrop-blur-sm"
                              animate={{ y: [0, -4, 0], scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Sparkles className="w-3 h-3 inline mr-1" />
                              NEW
                            </motion.span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* SIGN OUT */}
                <div className="mt-4 sm:mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500/90 to-red-500/90 hover:from-rose-600 hover:to-red-600 text-white font-semibold transition disabled:opacity-50"
                  >
                    {signingOut ? "Signing Out…" : (
                      <span className="inline-flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW: Notification Modal */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xl flex items-center justify-center px-3"
            onClick={() => setNotifOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-[95%] sm:w-[85%] md:w-[80%] lg:w-[80%] max-h-[80vh] overflow-hidden rounded-3xl
                         bg-white/7.5 backdrop-blur-2xl ring-1 ring-white/15 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-300" />
                  <h3 className="text-white font-bold text-base sm:text-lg">
                    Notifications ({headerUser.notifications})
                  </h3>
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto luxury-scroll">
                {(!notices || notices.length === 0) && (
                  <div className="text-white/70 text-sm">No notifications.</div>
                )}

                {/* Latest first as ensured by API sort; fallback sort here */}
                {([...notices].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))).map((n, idx) => (
                  <div key={idx} className="mb-3 last:mb-0 p-4 rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <div className="text-white text-sm leading-relaxed">
                      {n.message}
                    </div>
                    <div className="mt-2 text-[11px] text-white/60">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .luxury-scroll::-webkit-scrollbar { width: 6px; }
        .luxury-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .luxury-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(56,189,248,0.8), rgba(168,85,247,0.8));
          border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
        }
        .luxury-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(56,189,248,1), rgba(168,85,247,1));
        }
      `}</style>
    </>
  );
}
