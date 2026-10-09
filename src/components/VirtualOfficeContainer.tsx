'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import GameCanvas from './GameCanvas';
import { useSession } from 'next-auth/react';
import DashboardOverlay from './DashboardOverlay';
import QueueHUD from './QueueHUD';
import DocumentReviewModal from './DocumentReviewModal';

export default function VirtualOfficeContainer() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  // Mock Bots to show office activity
  useEffect(() => {
    const initialBots = [
      { id: 'bot1', name: 'Bot Xodim 1', role: 'EMPLOYEE', status: 'ONLINE', x: 10, y: 15, direction: 'down' },
      { id: 'bot2', name: 'Bot Xodim 2', role: 'EMPLOYEE', status: 'ONLINE', x: 20, y: 14, direction: 'up' },
      { id: 'bot3', name: 'Mijoz Sardor', role: 'CLIENT', status: 'ONLINE', x: 8, y: 6, direction: 'right' },
      { id: 'bot4', name: 'Direktor (Bot)', role: 'DIRECTOR', status: 'BUSY', x: 32, y: 5, direction: 'down' },
      { id: 'bot5', name: 'Mijoz Malika', role: 'CLIENT', status: 'ONLINE', x: 25, y: 18, direction: 'left' },
    ];
    
    setPlayers(prev => {
      const realPlayers = prev.filter(p => !p.id.startsWith('bot'));
      return [...initialBots, ...realPlayers];
    });

    const moveInterval = setInterval(() => {
      setPlayers(prev => prev.map(p => {
        if (p.id.startsWith('bot') && Math.random() > 0.3) {
          const dx = Math.floor(Math.random() * 3) - 1;
          const dy = Math.floor(Math.random() * 3) - 1;
          const newX = Math.max(1, Math.min(38, p.x + dx));
          const newY = Math.max(1, Math.min(23, p.y + dy));
          return { ...p, x: newX, y: newY };
        }
        return p;
      }));
    }, 1500);

    return () => clearInterval(moveInterval);
  }, []);

  useEffect(() => {
    const checkSchedule = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 13 && currentHour < 14) {
        setScheduleMsg('Tushlik tanaffusi (13:00 - 14:00)');
      } else if (currentHour < 10 || currentHour >= 19) {
        setScheduleMsg('Ish vaqti tugagan. Ofis yopiq (10:00 - 19:00)');
      } else {
        setScheduleMsg('');
      }
    };
    checkSchedule();
    const t = setInterval(checkSchedule, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      const socketIo = io({
        path: '/socket.io',
      });
      setSocket(socketIo);

      socketIo.on('connect', () => {
        socketIo.emit('join_office', {
          userId: session.user.id || 'anonymous',
          name: session.user.name || 'User',
          role: session.user.role || 'CLIENT',
        });
      });

      socketIo.on('office_state', (state) => {
        setPlayers(prev => {
          const bots = prev.filter(p => p.id.startsWith('bot'));
          return [...bots, ...state];
        });
      });

      socketIo.on('player_joined', (player) => {
        setPlayers((prev) => {
          if (prev.find(p => p.id === player.id)) return prev;
          return [...prev, player];
        });
      });

      socketIo.on('player_moved', (data) => {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === data.id
              ? { ...p, x: data.x, y: data.y, direction: data.direction }
              : p
          )
        );
      });

      socketIo.on('player_left', (id) => {
        setPlayers((prev) => prev.filter((p) => p.id !== id));
      });

      socketIo.on('status_changed', (data) => {
        setPlayers((prev) =>
          prev.map((p) => (p.id === data.id ? { ...p, status: data.status } : p))
        );
      });

      return () => {
        socketIo.disconnect();
      };
    }
  }, [status, session]);

  const handleMove = (x: number, y: number, direction: string) => {
    if (socket) {
      socket.emit('move', { x, y, direction });
    }
  };

  if (status === 'loading') return <div className="h-screen w-full flex items-center justify-center text-white bg-slate-900">Virtual ofis yuklanmoqda...</div>;
  if (status === 'unauthenticated') return <div className="h-screen w-full flex items-center justify-center text-white bg-slate-900">Virtual ofisga kirish uchun tizimga kiring.</div>;

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* 2D Canvas Layer */}
      <GameCanvas players={players} onMove={handleMove} currentSocketId={socket?.id} />

      {/* UI Overlay Layer */}
      <div className="absolute top-4 left-4 z-10 p-4 bg-slate-800/80 backdrop-blur-md rounded-xl text-white shadow-2xl border border-slate-700">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Notarial Idora</h1>
        <p className="text-sm text-slate-300">Haqiqiy foydalanuvchilar onlayn: {players.filter(p => !p.id.startsWith('bot')).length}</p>
      </div>

      <DashboardOverlay />
      <QueueHUD />

      {scheduleMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-red-600/90 text-white px-6 py-2 rounded-full shadow-lg font-bold backdrop-blur-md animate-pulse">
          {scheduleMsg}
        </div>
      )}
      
      {session?.user?.role === 'EMPLOYEE' && (
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={() => setIsReviewOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            Hujjatlar navbatini ochish
          </button>
        </div>
      )}

      {isReviewOpen && <DocumentReviewModal onClose={() => setIsReviewOpen(false)} />}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <button 
          onClick={() => socket?.emit('update_status', 'ONLINE')}
          className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          Ishda
        </button>
        <button 
          onClick={() => socket?.emit('update_status', 'BUSY')}
          className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          Band
        </button>
        <button 
          onClick={() => socket?.emit('update_status', 'IN_LUNCH')}
          className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          Tushlikda
        </button>
      </div>
    </div>
  );
}

