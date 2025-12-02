'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import BannerSlider from './components/BannerSlider';

interface Product {
  brand: string;
  category: string;
  product_name: string;
  price: number;
  seller_product_status: boolean;
  buyer_sku_code: string;
}

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  
  // Data State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [gameBrands, setGameBrands] = useState<string[]>([]);
  
  // Order State
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandProducts, setBrandProducts] = useState<Product[]>([]);
  const [userId, setUserId] = useState('');
  const [serverId, setServerId] = useState('');
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  
  // Loading State
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('username');
    if (!isLoggedIn) router.push('/login');
    else {
        setUsername(user || 'Admin');
        loadData();
    }
  }, []);

  const loadData = () => {
    const cache = localStorage.getItem('DIGI_PRODUCTS_CACHE');
    if (cache) {
        try {
            const parsed = JSON.parse(cache);
            let products = Array.isArray(parsed) ? parsed : (JSON.parse(parsed.products || '[]'));
            
            // Filter hanya Games
            products = products.filter((p: Product) => p.category === 'Games' && p.seller_product_status);
            setAllProducts(products);
            
            const brands = Array.from(new Set(products.map((p: Product) => p.brand))) as string[];
            setGameBrands(brands);
        } catch (e) { console.error('Error parsing data'); }
    }
  };

  const handleGameClick = (brand: string) => {
    setSelectedBrand(brand);
    // Filter produk berdasarkan brand & urutkan harga
    const products = allProducts
        .filter(p => p.brand === brand)
        .sort((a, b) => a.price - b.price);
    setBrandProducts(products);
    
    // Reset Form
    setUserId(''); setServerId(''); setSelectedSku(null); setNickname('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- LOGIKA CEK USERNAME ---
  const handleCheckId = async () => {
    if (!userId) return alert('Masukkan User ID dulu!');
    if (selectedBrand === 'MOBILE LEGENDS' && !serverId) return alert('Masukkan Server ID!');

    setIsCheckingId(true);
    setNickname('');

    try {
        const res = await fetch('/api/digi/check-id', {
            method: 'POST',
            body: JSON.stringify({
                game: selectedBrand,
                userId,
                zoneId: serverId
            })
        });
        const data = await res.json();
        
        if (data.success) {
            setNickname(data.nickname);
        } else {
            alert('Username tidak ditemukan!');
        }
    } catch (e) {
        alert('Gagal mengecek ID.');
    } finally {
        setIsCheckingId(false);
    }
  };

  // --- LOGIKA TRANSAKSI ---
  const handleBuy = async () => {
    const pin = prompt('Masukkan PIN Transaksi:');
    // Cek PIN sederhana (Di real app pakai API)
    if (pin !== '123456') return alert('PIN Salah!');

    setIsProcessing(true);

    // Format Nomor Tujuan (MLBB gabung Server ID)
    let customerNo = userId;
    if (selectedBrand === 'MOBILE LEGENDS') {
        customerNo = userId + serverId;
    }

    // Generate RefID Unik
    const refId = 'TRX-' + Math.floor(Math.random() * 1000000);

    try {
        const res = await fetch('/api/digi/transaction', {
            method: 'POST',
            body: JSON.stringify({
                buyer_sku_code: selectedSku,
                customer_no: customerNo,
                ref_id: refId
            })
        });
        const result = await res.json();

        if (result.success) {
            alert(`SUKSES!\nSN: ${result.data.sn}\nStatus: ${result.data.status}`);
            window.location.reload(); // Refresh halaman
        } else {
            alert(`GAGAL: ${result.message}`);
        }
    } catch (e) {
        alert('Terjadi kesalahan koneksi.');
    } finally {
        setIsProcessing(false);
    }
  };

  const isMLBB = selectedBrand === 'MOBILE LEGENDS';
  const isFF = selectedBrand === 'FREE FIRE';
  const canCheckId = isMLBB || isFF;

  // Helper Image
  const getBrandImage = (brand: string) => {
    const lower = brand.toLowerCase();
    if(lower.includes('mobile legend')) return '/games/mobile-legends.png'; 
    if(lower.includes('free fire')) return '/games/free-fire.png';
    if(lower.includes('pubg')) return '/games/pubg-mobile.png';
    if(lower.includes('valorant')) return '/games/valorant.png';
    if(lower.includes('genshin')) return '/games/genshin-impact.png';
    if(lower.includes('call of duty')) return '/games/call-of-duty-mobile.png';
    if(lower.includes('honor of kings')) return '/games/honor-of-kings.png';
    return `https://placehold.co/300x400/222/FFF?text=${brand}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pb-20">
      <Navbar username={username} onUpdateClick={() => loadData()} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!selectedBrand ? (
            <>
                <BannerSlider />
                <h2 className="text-2xl font-bold mb-4 border-l-4 border-blue-600 pl-3">Games</h2>
                {gameBrands.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {gameBrands.map((brand, i) => (
                            <div key={i} onClick={() => handleGameClick(brand)} className="group bg-[#18181b] border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 transition">
                                <img src={getBrandImage(brand)} alt={brand} className="aspect-[3/4] object-cover w-full group-hover:scale-110 transition duration-500" />
                                <div className="p-3 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full">
                                    <p className="text-xs font-bold text-center">{brand}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">Belum ada data. Update di menu profil.</div>
                )}
            </>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                {/* INFO GAME */}
                <div className="md:col-span-1">
                    <div className="bg-[#18181b] p-4 rounded-xl border border-gray-800 sticky top-24">
                        <img src={getBrandImage(selectedBrand)} className="w-32 rounded-lg mb-4 shadow-lg" />
                        <h1 className="text-xl font-bold">{selectedBrand}</h1>
                        <p className="text-gray-400 text-xs mt-2">Layanan otomatis 24 Jam.</p>
                        <button onClick={() => setSelectedBrand(null)} className="mt-4 text-sm text-blue-400 hover:underline">← Kembali</button>
                    </div>
                </div>

                {/* FORM ORDER */}
                <div className="md:col-span-2 space-y-4">
                    {/* 1. INPUT DATA */}
                    <div className="bg-[#18181b] p-5 rounded-xl border border-gray-800">
                        <h3 className="font-bold mb-3 flex items-center gap-2"><span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Masukkan ID</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="text" 
                                placeholder="User ID" 
                                className={`bg-[#0a0a0b] border border-gray-700 p-3 rounded-lg text-sm w-full ${isMLBB ? '' : 'col-span-2'}`}
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            />
                            {isMLBB && (
                                <input 
                                    type="text" 
                                    placeholder="Server ID (Ex: 2021)" 
                                    className="bg-[#0a0a0b] border border-gray-700 p-3 rounded-lg text-sm w-full"
                                    value={serverId}
                                    onChange={(e) => setServerId(e.target.value)}
                                />
                            )}
                        </div>
                        
                        {/* Tombol Cek Username */}
                        {canCheckId && (
                            <div className="mt-3 flex items-center gap-3">
                                <button 
                                    onClick={handleCheckId}
                                    disabled={isCheckingId}
                                    className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-2 rounded-lg transition"
                                >
                                    {isCheckingId ? 'Mengecek...' : 'Cek Username'}
                                </button>
                                {nickname && <span className="text-green-400 text-sm font-bold">Valid: {nickname}</span>}
                            </div>
                        )}
                    </div>

                    {/* 2. PILIH ITEM */}
                    <div className="bg-[#18181b] p-5 rounded-xl border border-gray-800">
                        <h3 className="font-bold mb-3 flex items-center gap-2"><span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Pilih Item</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {brandProducts.map((p) => (
                                <div 
                                    key={p.buyer_sku_code}
                                    onClick={() => setSelectedSku(p.buyer_sku_code)}
                                    className={`p-3 rounded-lg border cursor-pointer transition ${selectedSku === p.buyer_sku_code ? 'bg-blue-900/30 border-blue-500' : 'bg-[#0a0a0b] border-gray-700 hover:border-gray-500'}`}
                                >
                                    <p className="text-xs font-medium line-clamp-2">{p.product_name.replace(selectedBrand, '')}</p>
                                    <p className="text-sm font-bold text-blue-400 mt-2">Rp {p.price.toLocaleString('id-ID')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. BELI */}
                    <button 
                        onClick={handleBuy}
                        disabled={!selectedSku || !userId || (isMLBB && !serverId) || isProcessing}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isProcessing ? 'Memproses Transaksi...' : 'Beli Sekarang'}
                    </button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}