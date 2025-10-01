export default function HistoryTab({ items = [] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg md:text-xl font-bold">🗂️ History</h2>
      <div className="overflow-x-auto rounded-2xl bg-slate-900/70 ring-1 ring-white/10">
        <table className="min-w-[500px] w-full text-xs md:text-sm">
          <thead className="bg-white/10 text-fuchsia-300">
            <tr>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Details</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-center">Action</th>
              <th className="p-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {items.map((h) => (
              <tr key={h.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-3">{h.type}</td>
                <td className="p-3">{h.email}</td>
                <td className="p-3 text-right">{h.amount}</td>
                <td className="p-3 text-center">{h.action}</td>
                <td className="p-3 text-right">{h.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
