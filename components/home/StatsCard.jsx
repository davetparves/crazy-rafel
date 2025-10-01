// components/users/home/StatsCard.jsx
import React from 'react'

const StatsCard = React.memo(function StatsCard({ title, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="flex items-center">
        <div className={`${color} rounded-full p-2 mr-3`} />
        <div>
          <p className="text-xs text-gray-400">{title}</p>
          <p className="font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
})

export default StatsCard
