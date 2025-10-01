export default function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute -top-24 -left-24 h-64 w-64 md:h-80 md:w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 md:h-96 md:w-96 rounded-full bg-cyan-500/20 blur-3xl" />
    </div>
  )
}
