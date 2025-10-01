"use client";

import Footer from "@/components/admin-dashboard/Footer";
import CoinTransferSection from "@/components/admin-dashboard/sections/CoinTransferSection";
import EditMultiSection from "@/components/admin-dashboard/sections/EditMultiSection";
import PushNoticeSection from "@/components/admin-dashboard/sections/PushNoticeSection";
import ResultsSection from "@/components/admin-dashboard/sections/ResultsSection";
import SubAdminSection from "@/components/admin-dashboard/sections/SubAdminSection";
import UserManagementSection from "@/components/admin-dashboard/sections/UserManagementSection";
import TabsBar from "@/components/admin-dashboard/TabsBar";
import React, { useState } from "react";
import Company from "../components/admin-dashboard/sections/Company";
import ActivitySection from "../components/admin-dashboard/sections/ActivitySection";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("results");
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/sign-out", { method: "POST" });
    } catch {
      // ignore
    } finally {
      window.location.replace("/users/sign-in");
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case "results":
        return <ResultsSection />;
      case "transfer":
        return <CoinTransferSection />;
      case "subadmin":
        return <SubAdminSection />;
      case "users":
        return <UserManagementSection />;
      case "notices":
        return <PushNoticeSection />;
      case "editmulti":
        return <EditMultiSection />;
      case "activity":
        return <ActivitySection />;
      case "company":
        return <Company />;
      default:
        return <ResultsSection />;
    }
  };

  return (
    <div className="min-h-screen text-white bg-slate-950 [color-scheme:dark] overflow-x-hidden">
      {/* Background / subtle glass glows */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,#0f172a_0%,#020617_55%,#000_100%)]" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="pt-[env(safe-area-inset-top)]" />

      <TabsBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      <main className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="rounded-2xl sm:rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-4 sm:p-6 md:p-8">
          {renderTab()}
        </div>
      </main>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 pb-[env(safe-area-inset-bottom)]">
        <Footer />
      </div>
    </div>
  );
}
