'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useNotification } from '../context/NotificationContext'; 

interface LogData {
  date: string;
  status: string;
  ref_id: string;
  description: string;
  source: string;
}

export default function RiwayatPage() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  
  const [trxLogs, setTrxLogs] = useState<LogData[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogData[]>([]);

  const trxLogsRef = useRef<LogData[]>([]);
  
  const { showNotification } = useNotification(); 

  useEffect(() => {
    trxLogsRef.current = trxLogs;
  }, [trxLogs]);

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) setUsername(user);
    
    fetchHistory();

    const interval = setInterval(() => {
        checkPendingTransactions(); 
        fetchHistory(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSyncData = async () => {
    try {
        const res = await fetch('/api/digi/pricelist', { method: 'POST' });
        const result = await res.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            localStorage.setItem('DIGI_PRODUCTS_CACHE', JSON.stringify(result.data));
            showNotification(`Berhasil memperbarui ${result.data.length} produk!`, 'success');
            return true; 
        } else {
            showNotification(`Gagal: ${result.message}`, 'error');
            return false;
        }
    } catch (e) {
        showNotification('Gagal koneksi ke server.', 'error');
        return false;
    }
  };

  const checkPendingTransactions = async () => {
    const currentLogs = trxLogsRef.current;

    const pendingItems = currentLogs.filter(item => {
        const isPendingStatus = item.status === 'PENDING' || 
                                item.status === 'TRANSACTION' || 
                                item.description.includes('[PENDING]');
        
        const isActuallyDone = item.description.includes('[SUCCESS]') || 
                               item.description.includes('[FAILED]') || 
                               item.description.includes('Berhasil') || 
                               item.description.includes('Gagal');

        return isPendingStatus && !isActuallyDone;
    });

    if (pendingItems.length === 0) return;

    for (const item of pendingItems) {
        try {
            const parts = item.description.split('|');
            const customerNo = parts[1] ? parts[1].trim() : '';
            
            const mainDesc = parts[0];
            const skuMatch = mainDesc.match(/- (.*?)\./); 
            const buyerSku = skuMatch ? skuMatch[1].trim() : '';

            if (item.ref_id && customerNo && buyerSku) {
                await fetch('/api/digi/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ref_id: item.ref_id,
                        buyer_sku_code: buyerSku,
                        customer_no: customerNo
                    })
                });
            }
        } catch (e) {
            console.error("Gagal parse log untuk auto-update", e);
        }
    }
  };

  const fetchHistory = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/history');
      const json = await res.json();
      
      if (json.success) {
        const allData: LogData[] = json.data;

        const isSystemLog = (item: LogData) => {
            if (item.source.includes('auth') || item.source.includes('system')) return true;
            const desc = item.description.toUpperCase();
            if (desc.includes('PRICELIST') || desc.includes('SYSTEM') || desc.includes('CONFIG')) return true;
            return false;
        };

        const sys = allData.filter(item => isSystemLog(item));
        const rawTrx = allData.filter(item => !isSystemLog(item));

        rawTrx.sort((a, b) => a.date.localeCompare(b.date));

        const trxMap = new Map<string, LogData>();
        rawTrx.forEach(log => {
            if (log.ref_id) {
                trxMap.set(log.ref_id, log);
            }
        });

        const finalTrx = Array.from(trxMap.values()).sort((a, b) => b.date.localeCompare(a.date));
        const finalSys = sys.sort((a, b) => b.date.localeCompare(a.date));

        setSystemLogs(finalSys);
        setTrxLogs(finalTrx);
      }
    } catch (error) {
      console.error("Gagal koneksi backend:", error);
      if (!silent) showNotification("Gagal memuat riwayat", 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS' || s.includes('BERHASIL') || s.includes('SUKSES')) {
        return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]';
    }
    if (s === 'PENDING' || s.includes('PROSES') || s === 'TRANSACTION') {
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse'; 
    }
    if (s === 'FAILED' || s.includes('GAGAL')) {
        return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; 
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <Navbar username={username} onUpdateClick={handleSyncData} />

      <main className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
        
        {/* HEADER & REFRESH */}
        <div className="flex justify-end">
            <button 
                onClick={() => fetchHistory(false)}
                className="px-5 py-2.5 bg-[#18181b] border border-gray-700 hover:border-blue-500 hover:text-blue-400 rounded-xl text-sm font-medium transition-all shadow-lg flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {loading ? 'Memuat...' : 'Refresh Log'}
            </button>
        </div>

        {/* TABEL 1: TRANSAKSI */}
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
                <h2 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h2>
            </div>

            <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                
                {loading && trxLogs.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Loading data...</div>
                ) : trxLogs.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Belum ada transaksi penjualan.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#0a0a0b]/50 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Waktu</th>
                                    <th className="p-5 font-semibold">Ref ID</th>
                                    <th className="p-5 font-semibold">Keterangan</th>
                                    <th className="p-5 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 text-sm">
                                {trxLogs.map((log, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="p-5 text-gray-400 text-xs font-mono">{log.date}</td>
                                        <td className="p-5 text-blue-400 font-medium">{log.ref_id}</td>
                                        <td className="p-5 text-gray-300">
                                            {log.description.split('|')[0]}
                                        </td>
                                        <td className="p-5 text-center">
                                            {/* PENDING */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(log.status)}`}>
                                                {log.status === 'PENDING' || log.status === 'TRANSACTION' ? 'PENDING' : log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

        {/* SYSTEM */}
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-purple-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.8)]"></div>
                <h2 className="text-2xl font-bold tracking-tight">Aktivitas Sistem & Login</h2>
            </div>

            <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-500"></div>

                {loading && systemLogs.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Loading logs...</div>
                ) : systemLogs.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Belum ada aktivitas sistem.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#0a0a0b]/50 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Waktu</th>
                                    <th className="p-5 font-semibold">Aktivitas / Error</th>
                                    <th className="p-5 font-semibold text-center">Tipe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 text-sm">
                                {systemLogs.map((log, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="p-5 text-gray-400 text-xs font-mono w-48">{log.date}</td>
                                        <td className="p-5 text-gray-300">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${log.status === 'SYSTEM' ? 'bg-gray-800 text-gray-400' : log.description.includes('PRICELIST') ? 'bg-red-900/30 text-red-400' : 'bg-purple-900/30 text-purple-400'}`}>
                                                    {log.description.includes('PRICELIST') || log.status === 'FAILED' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    ) : log.status === 'SYSTEM' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    )}
                                                </div>
                                                <span className={`${log.description.includes('PRICELIST') ? 'text-red-300' : ''}`}>{log.description}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center w-32">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(log.status)}`}>
                                                {log.source.includes('auth') ? 'LOGIN' : log.description.includes('PRICELIST') ? 'ERROR' : log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
}