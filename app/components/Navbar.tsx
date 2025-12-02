'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  username: string;
  onUpdateClick: () => void; // Prop baru untuk handle tombol Update
}

export default function Navbar({ username, onUpdateClick }: NavbarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Dummy Saldo (Nanti bisa diambil dari API/Database)
  const [saldo, setSaldo] = useState('Rp 500.000'); 
  const [isUpdating, setIsUpdating] = useState(false);

  // Ref untuk klik di luar dropdown agar menutup otomatis
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const handleUpdateWrapper = async () => {
    setIsUpdating(true);
    // Simulasi loading update
    await new Promise(resolve => setTimeout(resolve, 1500));
    onUpdateClick(); // Panggil fungsi update dari Parent
    setIsUpdating(false);
    setIsProfileOpen(false); // Tutup dropdown
    alert('Produk berhasil diupdate dari Digiflazz!');
  };

  return (
    <nav className="border-b border-gray-800 bg-[#18181b]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* --- LOGO --- */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-purple-500 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                <img 
                  src="/logos/logo.png" 
                  alt="Logo" 
                  className="w-full h-full rounded-full bg-[#0a0a0b] object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <span className="font-bold text-xl tracking-wide text-white group-hover:text-blue-400 transition">
                Linsofc<span className="text-blue-500">Store</span>
              </span>
            </Link>
          </div>

          {/* --- DESKTOP MENU (Tengah) --- */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white font-medium transition duration-200 text-sm">
              Beranda
            </Link>
            <Link href="/riwayat" className="text-gray-300 hover:text-blue-400 font-medium transition duration-200 text-sm flex items-center gap-1">
              Riwayat
            </Link>
            <Link href="/kalkulator" className="text-gray-300 hover:text-white font-medium transition duration-200 text-sm">
              Kalkulator WR
            </Link>
          </div>
          
          {/* --- RIGHT SECTION (Profile & Mobile Toggle) --- */}
          <div className="flex items-center gap-4">
            
            {/* PROFILE DROPDOWN (Desktop & Mobile) */}
            <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 focus:outline-none"
                >
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-semibold text-gray-200">Hi, {username}</span>
                        <span className="text-[10px] text-blue-400 font-mono">{saldo}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gray-700 border border-gray-600 overflow-hidden hover:border-blue-500 transition">
                         <img src={`https://ui-avatars.com/api/?name=${username}&background=0D8ABC&color=fff`} alt="User" />
                    </div>
                </button>

                {/* --- DROPDOWN CONTENT --- */}
                {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#18181b] border border-gray-700 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                        {/* Info Saldo Mobile Only (opsional jika mau ditampilkan lagi) */}
                        <div className="px-4 py-3 border-b border-gray-800 md:hidden">
                            <p className="text-sm text-gray-400">Login sebagai</p>
                            <p className="font-semibold text-white">{username}</p>
                        </div>
                        
                        {/* SECTION SALDO */}
                        <div className="px-4 py-3 bg-blue-600/10 mx-2 rounded-lg mb-2 border border-blue-600/20">
                            <p className="text-xs text-blue-300 uppercase font-bold tracking-wider">Saldo Digiflazz</p>
                            <p className="text-lg font-bold text-white mt-1">{saldo}</p>
                        </div>

                        {/* MENU ITEMS */}
                        <button 
                            onClick={handleUpdateWrapper}
                            disabled={isUpdating}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isUpdating ? 'Sedang Update...' : 'Update Produk'}
                        </button>

                        <div className="border-t border-gray-800 my-1"></div>

                        <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Keluar
                        </button>
                    </div>
                )}
            </div>

            {/* HAMBURGER BUTTON (Mobile Only) */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition"
            >
                {isMobileMenuOpen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

          </div>
        </div>
      </div>

      {/* --- MOBILE MENU DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#18181b] border-b border-gray-800 animate-in slide-in-from-top-5">
            <div className="px-4 pt-2 pb-4 space-y-1">
                <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gray-900">
                    Beranda
                </Link>
                <Link href="/riwayat" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                    Riwayat Transaksi
                </Link>
                <Link href="/kalkulator" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                    Kalkulator WR
                </Link>
            </div>
        </div>
      )}
    </nav>
  );
}