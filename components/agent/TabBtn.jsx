'use client'

export default function TabBtn({ id, activeId, onClick, children }) {
  const isActive = activeId === id
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full h-10 rounded-sm font-semibold text-sm md:text-base transition-all shadow-xl
        ${
          isActive
            ? 'bg-gradient-to-r from-fuchsia-400 via-fuchsia-600 to-fuchsia-900 text-white shadow-fuchsia-500/40 scale-105'
            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:scale-105'
        }`}
    >
      {children}
    </button>
  )
}
