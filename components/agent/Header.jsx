export default function Header({ title}) {
  return (
    <div className="text-center mb-6 md:mb-8">
      <h1 className="text-xl md:text-4xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-400 drop-shadow">
        {title}
      </h1>
      <div className="flex justify-center gap-3 items-center text-xs md:text-sm text-white/60">
      </div>
    </div>
  )
}
