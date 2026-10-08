'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

export default function DashboardOverlay() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState({
    employeeCount: 0,
    onlineEmployees: 0,
    pendingDocuments: 0,
    queueLength: 0
  });

  useEffect(() => {
    if (session?.user?.role !== 'DIRECTOR') return;

    const fetchMetrics = async () => {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [session]);

  if (session?.user?.role !== 'DIRECTOR') return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 p-5 shadow-2xl text-white">
      <h2 className="text-lg font-bold mb-4 text-amber-500 flex items-center gap-2">
        <Users className="w-5 h-5" /> Direktor Paneli
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center">
          <CheckCircle className="w-6 h-6 text-green-400 mb-1" />
          <span className="text-2xl font-bold">{metrics.onlineEmployees}/{metrics.employeeCount}</span>
          <span className="text-xs text-slate-400 text-center">Onlayn Xodimlar</span>
        </div>
        
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center">
          <FileText className="w-6 h-6 text-blue-400 mb-1" />
          <span className="text-2xl font-bold">{metrics.pendingDocuments}</span>
          <span className="text-xs text-slate-400 text-center">Kutilayotgan Hujjatlar</span>
        </div>

        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center col-span-2">
          <Clock className="w-6 h-6 text-purple-400 mb-1" />
          <span className="text-2xl font-bold">{metrics.queueLength}</span>
          <span className="text-xs text-slate-400 text-center">Navbatdagi Fuqarolar</span>
        </div>
      </div>
    </div>
  );
}
