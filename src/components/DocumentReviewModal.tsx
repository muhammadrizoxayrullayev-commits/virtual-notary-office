'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  contentUrl: string;
  status: string;
  createdAt: string;
  client: { name: string; email: string };
}

export default function DocumentReviewModal({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.documents || []);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, status } : doc));
      setSelectedDoc(null);
    }
  };

  if (session?.user?.role !== 'EMPLOYEE') return null;

  const getStatusText = (status: string) => {
    if (status === 'PENDING') return 'KUTILMOQDA';
    if (status === 'APPROVED') return 'TASDIQLANDI';
    if (status === 'REJECTED') return 'RAD ETILDI';
    return status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-2xl border border-slate-700">
        
        {/* Document List Sidebar */}
        <div className="w-1/3 bg-slate-900 border-r border-slate-700 overflow-y-auto">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 sticky top-0">
            <h2 className="text-white font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Ko'rib chiqish
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
          </div>
          
          {loading ? (
            <p className="text-slate-400 p-4">Hujjatlar yuklanmoqda...</p>
          ) : (
            <div className="p-2 space-y-2">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-xl cursor-pointer border transition-colors ${selectedDoc?.id === doc.id ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                >
                  <p className="text-white font-semibold truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Mijoz: {doc.client.name}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {doc.status === 'PENDING' && <Clock className="w-3 h-3 text-yellow-400" />}
                    {doc.status === 'APPROVED' && <CheckCircle className="w-3 h-3 text-green-400" />}
                    {doc.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-400" />}
                    <span className="text-[10px] uppercase text-slate-300">{getStatusText(doc.status)}</span>
                  </div>
                </div>
              ))}
              {documents.length === 0 && <p className="text-slate-500 text-sm p-2 text-center">Navbatda hujjatlar yo'q.</p>}
            </div>
          )}
        </div>

        {/* Document Viewer Area */}
        <div className="flex-1 flex flex-col bg-slate-800">
          {selectedDoc ? (
            <>
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-2xl font-bold text-white mb-2">{selectedDoc.title}</h3>
                <p className="text-slate-400 text-sm">Yuboruvchi: {selectedDoc.client.name} ({selectedDoc.client.email})</p>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-900/50">
                  <p className="text-slate-500 text-center">[{selectedDoc.contentUrl}]<br/>Hujjatni ko'rish maydoni</p>
                </div>
              </div>
              <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-end gap-3">
                <button 
                  onClick={() => updateStatus(selectedDoc.id, 'REJECTED')}
                  className="px-6 py-2 bg-red-600/20 text-red-400 border border-red-500 hover:bg-red-600 hover:text-white transition-colors rounded-lg font-semibold"
                >
                  Rad etish
                </button>
                <button 
                  onClick={() => updateStatus(selectedDoc.id, 'APPROVED')}
                  className="px-6 py-2 bg-green-600 text-white hover:bg-green-500 transition-colors rounded-lg font-semibold shadow-lg shadow-green-600/30"
                >
                  Tasdiqlash va Notarial tasdiqlash
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Ko'rib chiqish uchun hujjatni tanlang
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
