'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Ticket } from 'lucide-react';

export default function QueueHUD() {
  const { data: session } = useSession();
  const [ticketNum, setTicketNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session?.user?.role !== 'CLIENT') return null;

  const handleJoinQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/queue/join', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setTicketNum(data.ticket.id);
      } else {
        setError(data.error === 'You are already in the queue' ? 'Siz allaqachon navbatdasiz' : 'Navbatga qo\'shilib bo\'lmadi');
        if (data.ticket) {
          setTicketNum(data.ticket.id);
        }
      }
    } catch (err) {
      setError('Navbatga qo\'shilishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-64 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 p-5 shadow-2xl text-white">
      <h2 className="text-lg font-bold mb-3 text-indigo-400 flex items-center gap-2">
        <Ticket className="w-5 h-5" /> Navbat Holati
      </h2>
      
      {ticketNum ? (
        <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-indigo-500/30">
          <p className="text-sm text-slate-400 mb-1">Sizning chipta raqamingiz</p>
          <p className="text-4xl font-black text-indigo-400">#{ticketNum}</p>
          <p className="text-xs text-slate-500 mt-2">Iltimos, kutish zalida kuting</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-300 mb-2">Notarial xizmat kerakmi?</p>
          <button 
            onClick={handleJoinQueue}
            disabled={loading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-lg font-semibold shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            {loading ? 'Ulanmoqda...' : 'Navbat chiptasini olish'}
          </button>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
