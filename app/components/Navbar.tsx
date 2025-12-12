"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { sendLogToBackend } from "@/utils/logger";

interface NavbarProps {
    username: string;
    onUpdateClick: () => Promise<boolean>;
}

export default function Navbar({ username, onUpdateClick }: NavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [saldo, setSaldo] = useState<number | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<(HTMLAnchorElement | null)[]>([]);

    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

    const navItems = [
        { name: 'Topup', path: '/' },
        { name: 'Cek Transaksi', path: '/riwayat' },
        { name: 'Kalkulator', path: '/kalkulator' },
    ];

    const updateIndicator = (element: HTMLElement) => {
        if (!element) return;
        setIndicatorStyle({
            left: element.offsetLeft,
            width: element.offsetWidth,
            opacity: 1
        });
    };

    useEffect(() => {
        const activeIndex = navItems.findIndex(item => item.path === pathname);
        if (activeIndex !== -1 && tabsRef.current[activeIndex]) {
            updateIndicator(tabsRef.current[activeIndex]!);
        }
    }, [pathname]);

    const handleMouseEnter = (index: number) => {
        if (tabsRef.current[index]) {
            updateIndicator(tabsRef.current[index]!);
        }
    };

    const handleMouseLeave = () => {
        const activeIndex = navItems.findIndex(item => item.path === pathname);
        if (activeIndex !== -1 && tabsRef.current[activeIndex]) {
            updateIndicator(tabsRef.current[activeIndex]!);
        } else {
            setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (username) fetchBalance();
    }, [username]);

    const fetchBalance = async () => {
        try {
            const res = await fetch("/api/digi/balance", { method: "POST" });
            const data = await res.json();
            if (data.success) setSaldo(data.balance);
        } catch (error) {
            console.error("Gagal mengambil saldo");
        }
    };

    const handleLogout = () => {
        sendLogToBackend("auth", `User '${username}' logout dari sistem.`);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        router.replace("/login");
    };

    const handleUpdateWrapper = async () => {
        setIsUpdating(true);
        sendLogToBackend("system", `User '${username}' sinkronisasi data.`);
        await onUpdateClick();
        await fetchBalance();
        setIsUpdating(false);
        setIsProfileOpen(false);
    };

    const formatRupiah = (amount: number | null) => {
        if (amount === null) return "Rp ...";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <nav className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50 font-sans">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    
                    {/* --- LEFT: LOGO --- */}
                    <div className="flex-shrink-0 flex items-center gap-6">
                        <Link href="/" className="group relative w-10 h-10">
                            {/* Glow Biru */}
                            <div className="absolute inset-0 bg-blue-600 blur-lg opacity-20 group-hover:opacity-40 transition duration-500 rounded-full"></div>
                            <img
                                src="/logos/logo.png"
                                alt="Logo"
                                className="relative w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                        </Link>
                    </div>

                    {/* --- CENTER: NAVIGATION LINKS (Desktop Only) --- */}
                    <div 
                        className="hidden md:flex items-center gap-8 relative h-full" 
                        ref={navRef}
                        onMouseLeave={handleMouseLeave}
                    >
                        {navItems.map((item, index) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    ref={el => { tabsRef.current[index] = el }}
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    className={`
                                        relative z-10 h-full flex items-center px-2 text-sm font-bold tracking-wide transition-colors duration-300
                                        ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}
                                    `}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}

                        {/* THE MAGIC SLIDING LINE (BLUE) */}
                        <div
                            className="absolute bottom-0 h-[3px] bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.6)] rounded-t-full transition-all duration-300 ease-out z-0"
                            style={{
                                left: indicatorStyle.left,
                                width: indicatorStyle.width,
                                opacity: indicatorStyle.opacity,
                            }}
                        />
                    </div>

                    {/* --- RIGHT: PROFILE & MOBILE BUTTON --- */}
                    <div className="flex items-center gap-4">
                        
                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 focus:outline-none group pl-2 py-1 rounded-lg hover:bg-white/5 transition-all"
                            >
                                <div className="hidden lg:flex flex-col items-end">
                                    {/* Hover Text Biru */}
                                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                                        {username}
                                    </span>
                                    <span className="text-[10px] text-blue-500 font-mono">
                                        {formatRupiah(saldo)}
                                    </span>
                                </div>
                                {/* Ring Biru saat Hover */}
                                <div className="w-9 h-9 rounded-full bg-gray-800 p-[2px] ring-2 ring-transparent group-hover:ring-blue-500/50 transition">
                                    <img
                                        // Avatar Background Biru (2563EB)
                                        src={`https://ui-avatars.com/api/?name=${username}&background=2563EB&color=fff&bold=true`}
                                        alt="User"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-[#1a1a1c] border border-gray-800 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-800 lg:hidden">
                                        <p className="text-white font-bold">{username}</p>
                                        <p className="text-blue-500 text-sm font-mono mt-1">{formatRupiah(saldo)}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={handleUpdateWrapper}
                                            disabled={isUpdating}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isUpdating ? "animate-spin text-blue-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Sync Data
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center gap-3 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button (Hamburger) */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MOBILE MENU DROPDOWN --- */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#121212] border-t border-gray-800 animate-in slide-in-from-top-5 absolute w-full left-0 shadow-2xl z-40">
                    <div className="p-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                                    pathname === item.path
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}