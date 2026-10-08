import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="z-10 text-center space-y-8 p-12 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl max-w-2xl">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Virtual Notarial Idora
        </h1>
        <p className="text-lg text-slate-300">
          Huquqiy maslahat va hujjatlarni tekshirish uchun bizning 2D interaktiv ish maydonimizga kiring.
        </p>
        
        <Link 
          href="/office"
          className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transform hover:-translate-y-1"
        >
          Ofisga kirish
        </Link>
      </div>
    </div>
  );
}
