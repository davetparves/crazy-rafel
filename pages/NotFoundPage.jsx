export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center border border-white/10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-fuchsia-500 to-sky-400 bg-clip-text text-transparent">
          404 - পেজ পাওয়া যায়নি
        </h1>
        <p className="mt-4 text-slate-300">
          দুঃখিত 😢 আপনি যে পেজে ঢুকতে চেয়েছিলেন সেটা নেই।
        </p>
      </div>
    </div>
  )
}
