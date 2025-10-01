// /app/agent/page.jsx
'use client'
import React, { useState } from 'react'

import GlowBackground from '../components/agent/GlowBackground'
import Header from '../components/agent/Header'
import TabBtn from '../components/agent/TabBtn'
import SignOutButton from '../components/agent/SignOutButton'
import MainCard from '../components/agent/MainCard'
import DashboardTab from '../components/agent/tabs/DashboardTab'
import LinksTab from '../components/agent/tabs/LinksTab'
import DepositTab from '../components/agent/tabs/DepositTab'
import WithdrawTab from '../components/agent/tabs/WithdrawTab'
import HistoryTab from '../components/agent/tabs/HistoryTab'
import TransferTab from '../components/agent/tabs/ransferTab' // আপনার ফাইলে যেটা ছিল

export default function AgentDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen relative text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)] p-3 md:p-8">
      <GlowBackground />
      <Header title="🧑‍💼 CRAZY RAFEL Sub Admin Dashboard" />

      {/* Tabs + Sign out */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <TabBtn id="dashboard" activeId={activeTab} onClick={setActiveTab}>
          📊 Dashboard
        </TabBtn>
        <TabBtn id="transfer" activeId={activeTab} onClick={setActiveTab}>
          🪙 Transfer
        </TabBtn>
        <TabBtn id="links" activeId={activeTab} onClick={setActiveTab}>
          🔗 Links
        </TabBtn>
        <TabBtn id="deposit" activeId={activeTab} onClick={setActiveTab}>
          📥 Deposit
        </TabBtn>
        <TabBtn id="withdraw" activeId={activeTab} onClick={setActiveTab}>
          💸 Withdraw
        </TabBtn>
        <TabBtn id="history" activeId={activeTab} onClick={setActiveTab}>
          🗂️ History
        </TabBtn>

        <SignOutButton />
      </div>

      <MainCard>
        {activeTab === 'dashboard' && <DashboardTab />}

        {activeTab === 'transfer' && <TransferTab />}

        {activeTab === 'links' && <LinksTab />}

        {activeTab === 'deposit' && <DepositTab items={[]} />}

        {activeTab === 'withdraw' && <WithdrawTab items={[]} />}

        {activeTab === 'history' && <HistoryTab items={[]} />}
      </MainCard>
    </div>
  )
}
