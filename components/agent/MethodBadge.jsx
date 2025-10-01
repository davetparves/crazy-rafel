const map = {
  bKash: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Nagad: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Upay: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Rocket: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
}

export default function MethodBadge({ method }) {
  const cls = map[method] || 'bg-white/10 text-white/70 border-white/20'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>{method}</span>
  )
}
