// app/kalkulator/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNotification } from '../context/NotificationContext'; 

export default function KalkulatorPage() {
  const [activeTab, setActiveTab] = useState<'wr' | 'magic' | 'zodiac'>('wr');
  const [username, setUsername] = useState('');
  const { showNotification } = useNotification();

  // --- STATE CALCULATOR ---
  // Menggunakan string agar input fleksibel (bisa kosong & bisa desimal)
  
  // 1. Win Rate
  const [totalMatch, setTotalMatch] = useState('');
  const [totalWr, setTotalWr] = useState('');
  const [targetWr, setTargetWr] = useState('');
  const [resultWr, setResultWr] = useState<number | null>(null);

  // 2. Magic Wheel
  const [magicPoint, setMagicPoint] = useState('');
  const [resultMagic, setResultMagic] = useState<{spins: number, diamonds: number} | null>(null);

  // 3. Zodiac
  const [zodiacPoint, setZodiacPoint] = useState('');
  const [resultZodiac, setResultZodiac] = useState<{spins: number, diamonds: number} | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) setUsername(user);
  }, []);

  // --- LOGIC PERHITUNGAN ---

  const calculateWr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalMatch || !totalWr || !targetWr) return;
    
    // Konversi ke Number saat tombol hitung ditekan
    const tMatch = parseFloat(totalMatch);
    const tWr = parseFloat(totalWr);
    const trgWr = parseFloat(targetWr);

    if (trgWr > 99.9 || trgWr <= tWr) {
        showNotification('Target WR tidak valid (Harus lebih besar dari WR saat ini & di bawah 100%)', 'error');
        return;
    }

    // Rumus: (TotalMatch * (TargetWR - TotalWR)) / (100 - TargetWR)
    const result = (tMatch * (trgWr - tWr)) / (100 - trgWr);
    setResultWr(Math.ceil(result));
  };

  const calculateMagic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicPoint) return;
    
    const current = parseInt(magicPoint);
    if (current >= 200) {
        setResultMagic({ spins: 0, diamonds: 0 });
        return;
    }

    const remaining = 200 - current;
    // Asumsi: 1 Spin = 60 Diamond (Harga Satuan Maksimal)
    const diamonds = remaining * 60; 
    setResultMagic({ spins: remaining, diamonds });
  };

  const calculateZodiac = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zodiacPoint) return;

    const current = parseInt(zodiacPoint);
    if (current >= 100) {
        setResultZodiac({ spins: 0, diamonds: 0 });
        return;
    }

    const remaining = 100 - current;
    // Asumsi: 1 Spin = 20 Diamond
    const diamonds = remaining * 20;
    setResultZodiac({ spins: remaining, diamonds });
  };

  const handleSyncData = async () => { return true; };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pb-20 font-sans">
      <Navbar username={username} onUpdateClick={handleSyncData} />

      <main className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                Kalkulator Mobile Legends
            </h1>
            <p className="text-gray-400">Hitung target kemenangan dan estimasi diamond dengan mudah.</p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex justify-center mb-8">
            <div className="bg-[#18181b] p-1.5 rounded-xl border border-gray-800 flex gap-1">
                <button 
                    onClick={() => setActiveTab('wr')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                        activeTab === 'wr' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Win Rate
                </button>
                <button 
                    onClick={() => setActiveTab('magic')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                        activeTab === 'magic' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Magic Wheel
                </button>
                <button 
                    onClick={() => setActiveTab('zodiac')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                        activeTab === 'zodiac' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Zodiac
                </button>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
            
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-[50%] h-[50%] blur-[100px] rounded-full opacity-20 pointer-events-none transition-colors duration-500 ${
                activeTab === 'wr' ? 'bg-blue-600' : activeTab === 'magic' ? 'bg-purple-600' : 'bg-indigo-600'
            }`}></div>

            {/* --- 1. WIN RATE CALCULATOR --- */}
            {activeTab === 'wr' && (
                <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Hitung Win Rate</h2>
                            <p className="text-xs text-gray-400">Estimasi jumlah kemenangan tanpa kalah (Win Streak).</p>
                        </div>
                    </div>

                    <form onSubmit={calculateWr} className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold ml-1">Total Pertandingan</label>
                                <input 
                                    type="number" 
                                    placeholder="Contoh: 350"
                                    value={totalMatch}
                                    onChange={(e) => setTotalMatch(e.target.value)}
                                    className="w-full mt-1 bg-[#0a0a0b] border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold ml-1">Win Rate Saat Ini (%)</label>
                                <input 
                                    type="number" 
                                    placeholder="Contoh: 50.5"
                                    value={totalWr}
                                    onChange={(e) => setTotalWr(e.target.value)}
                                    className="w-full mt-1 bg-[#0a0a0b] border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    step="0.1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold ml-1">Target Win Rate (%)</label>
                                <input 
                                    type="number" 
                                    placeholder="Contoh: 60"
                                    value={targetWr}
                                    onChange={(e) => setTargetWr(e.target.value)}
                                    className="w-full mt-1 bg-[#0a0a0b] border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    step="0.1"
                                    required
                                />
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-600/20">
                                Hitung Hasil
                            </button>
                        </div>

                        {/* RESULT BOX */}
                        <div className="bg-[#0a0a0b] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                            {resultWr !== null ? (
                                <>
                                    <p className="text-gray-400 text-sm mb-2">Kamu butuh kemenangan beruntun sebanyak</p>
                                    <p className="text-6xl font-black text-white tracking-tighter mb-2 group-hover:scale-110 transition duration-500">
                                        {resultWr}
                                    </p>
                                    <p className="text-blue-400 font-bold uppercase tracking-wide text-sm">Win Streak</p>
                                    <div className="mt-4 text-xs text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                                        Total Match nanti: {Number(totalMatch) + resultWr}
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-600">
                                    <svg className="w-16 h-16 mx-auto mb-3 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21 1.63.33 3.25.33 3.26 0 3.86-3.59 7-8 7z"/></svg>
                                    <p>Masukkan data di sebelah kiri</p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* --- 2. MAGIC WHEEL CALCULATOR --- */}
            {activeTab === 'magic' && (
                <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                     <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Magic Wheel</h2>
                            <p className="text-xs text-gray-400">Estimasi sisa diamond untuk Legend Skin (Max 200 Point).</p>
                        </div>
                    </div>

                    <form onSubmit={calculateMagic} className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold ml-1">Magic Point Saat Ini</label>
                                <input 
                                    type="number" 
                                    placeholder="0 - 199"
                                    value={magicPoint}
                                    onChange={(e) => setMagicPoint(e.target.value)}
                                    className="w-full mt-1 bg-[#0a0a0b] border border-gray-700 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    max="200"
                                    required
                                />
                            </div>
                            <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-600/20">
                                Hitung Estimasi
                            </button>
                        </div>

                        {/* RESULT BOX */}
                        <div className="bg-[#0a0a0b] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                             {resultMagic !== null ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                            <p className="text-gray-400 text-xs mb-1">Kurang Point</p>
                                            <p className="text-3xl font-bold text-white">{resultMagic.spins}</p>
                                        </div>
                                        <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/20">
                                            <p className="text-purple-300 text-xs mb-1">Butuh Diamond</p>
                                            <p className="text-3xl font-bold text-purple-400">{resultMagic.diamonds.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs text-gray-500 max-w-xs">
                                        *Estimasi maksimal (1 spin = 60 dm). Bisa lebih murah jika menggunakan COA atau diskon mingguan (5 spin = 270 dm).
                                    </p>
                                </>
                            ) : (
                                <div className="text-gray-600">
                                    <p>Masukkan Magic Point Anda</p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* --- 3. ZODIAC CALCULATOR --- */}
            {activeTab === 'zodiac' && (
                <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Zodiac Summon</h2>
                            <p className="text-xs text-gray-400">Estimasi diamond untuk mendapatkan skin Zodiac (Max 100).</p>
                        </div>
                    </div>

                    <form onSubmit={calculateZodiac} className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold ml-1">Star Power Saat Ini</label>
                                <input 
                                    type="number" 
                                    placeholder="0 - 99"
                                    value={zodiacPoint}
                                    onChange={(e) => setZodiacPoint(e.target.value)}
                                    className="w-full mt-1 bg-[#0a0a0b] border border-gray-700 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    max="100"
                                    required
                                />
                            </div>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20">
                                Hitung Estimasi
                            </button>
                        </div>

                        {/* RESULT BOX */}
                        <div className="bg-[#0a0a0b] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                             {resultZodiac !== null ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                            <p className="text-gray-400 text-xs mb-1">Kurang Power</p>
                                            <p className="text-3xl font-bold text-white">{resultZodiac.spins}</p>
                                        </div>
                                        <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20">
                                            <p className="text-indigo-300 text-xs mb-1">Butuh Diamond</p>
                                            <p className="text-3xl font-bold text-indigo-400">{resultZodiac.diamonds.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs text-gray-500 max-w-xs">
                                        *Estimasi (1 point ≈ 20 dm). Bisa menggunakan Crystal of Aurora (COA) untuk lebih hemat.
                                    </p>
                                </>
                            ) : (
                                <div className="text-gray-600">
                                    <p>Masukkan Star Power Anda</p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}