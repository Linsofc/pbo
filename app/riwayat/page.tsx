'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useNotification } from '../context/NotificationContext';

interface Transaction {
  id: string;
  date: string;
  status: string;
  ref_id: string;
  customer_no: string;
  buyer_sku_code: string;
  sn: string;
  price: number;
  message: string;
}

export default function RiwayatPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      const json = await res.json();
      if (json.success) setTransactions(json.data);
    } catch (error) {
      showNotification("Gagal memuat riwayat", 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('SUKSES') || s === 'SUCCESS') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (s.includes('PENDING') || s === 'TRANSACTION') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 animate-pulse';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="min-h-screen text-white pb-20 bg-[#09090b]">
      <Navbar username="Admin" onUpdateClick={function (): Promise<boolean> {
              throw new Error('Function not implemented.');
          } } />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
            Riwayat Transaksi
          </h2>
          <button onClick={fetchHistory} className="p-2 hover:bg-white/5 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Tabel Transaksi */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/20 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="p-5 font-semibold">Waktu</th>
                  <th className="p-5 font-semibold">Produk / Ref ID</th>
                  <th className="p-5 font-semibold">Tujuan</th>
                  <th className="p-5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((trx) => (
                  <tr 
                    key={trx.id} 
                    onClick={() => setSelectedTrx(trx)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <td className="p-5 text-gray-400 text-xs font-mono">
                      {new Date(trx.date).toLocaleString('id-ID')}
                    </td>
                    <td className="p-5">
                      <div className="font-medium text-blue-400">{trx.buyer_sku_code}</div>
                      <div className="text-xs text-gray-500 uppercase">{trx.ref_id}</div>
                    </td>
                    <td className="p-5 text-gray-300 font-mono text-sm">{trx.customer_no}</td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(trx.status)}`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL INVOICE */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1c1c21] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center border-b border-white/5">
              <h3 className="text-xl font-bold">Detail Transaksi</h3>
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">{selectedTrx.ref_id}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${getStatusStyle(selectedTrx.status).split(' ')[0]}`}>{selectedTrx.status}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Produk</span>
                <span className="font-semibold">{selectedTrx.buyer_sku_code}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Tujuan</span>
                <span className="font-mono">{selectedTrx.customer_no}</span>
              </div>
              
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase block mb-1">Serial Number / Pesan</span>
                <p className="text-sm font-mono text-blue-400 break-all">{selectedTrx.sn || selectedTrx.message}</p>
              </div>

              <div className="pt-4 border-t border-dashed border-white/10 flex justify-between items-center">
                <span className="text-gray-400">Total Harga</span>
                <span className="text-xl font-bold text-green-400">Rp {selectedTrx.price.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button 
                onClick={() => setSelectedTrx(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all"
              >
                Tutup Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}