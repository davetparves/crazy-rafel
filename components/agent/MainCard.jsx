export default function MainCard({ children }) {
  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 backdrop-blur-xl shadow-xl p-4 md:p-8">
      {children}
    </div>
  )
}
