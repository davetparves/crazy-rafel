'use client'

export default function DepositTab({ items = [] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg md:text-xl font-bold">📥 Deposit Requests</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((r) => (
          <div key={r.id} className="rounded-2xl bg-slate-900/70 ring-1 ring-white/10 p-5">
            <p className="text-xs text-white/70">{r.email}</p>
            <p className="text-2xl font-bold text-emerald-300">{r.amount} Coins</p>
            <p className="text-xs text-white/50">At {r.requestedAt}</p>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 rounded-lg bg-emerald-400/90 text-black font-bold py-2 text-sm">
                ✅ Accept
              </button>
              <button className="flex-1 rounded-lg bg-rose-400/90 text-black font-bold py-2 text-sm">
                ❌ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
