"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "./components/Navbar";
import BannerSlider from "./components/BannerSlider";
import { useNotification } from "./context/NotificationContext";

interface Product {
    brand: string;
    category: string;
    product_name: string;
    price: number;
    seller_product_status: boolean;
    buyer_sku_code: string;
}

export default function Home() {
    const [username, setUsername] = useState("");

    // Data State
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Order State
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [brandProducts, setBrandProducts] = useState<Product[]>([]);
    const [userId, setUserId] = useState("");
    const [serverId, setServerId] = useState("");
    const [selectedSku, setSelectedSku] = useState<string | null>(null);
    const [nickname, setNickname] = useState("");

    // Loading & Notif
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showNotification } = useNotification();

    // --- STATE MODAL PIN ---
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState("");
    const pinInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        const user = localStorage.getItem("username");
        if (!isLoggedIn) {
            window.location.href = "/login";
        } else {
            setUsername(user || "Admin");
            loadDataFromCache();
        }
    }, []);

    // Fokus otomatis ke input PIN saat modal terbuka
    useEffect(() => {
        if (isPinModalOpen && pinInputRef.current) {
            setTimeout(() => pinInputRef.current?.focus(), 100);
        }
    }, [isPinModalOpen]);

    const loadDataFromCache = () => {
        const cache = localStorage.getItem("DIGI_PRODUCTS_CACHE");
        if (cache) {
            try {
                const products = JSON.parse(cache);
                processProducts(products);
            } catch (e) {
                console.error("Cache rusak", e);
            }
        }
    };

    const processProducts = (rawData: Product[]) => {
        const activeProducts = rawData.filter((p) => p.seller_product_status);
        setAllProducts(activeProducts);

        // Urutkan kategori
        const uniqueCats = Array.from(
            new Set(activeProducts.map((p) => p.category))
        ).sort();
        if (uniqueCats.includes("Games")) {
            const idx = uniqueCats.indexOf("Games");
            uniqueCats.splice(idx, 1);
            uniqueCats.unshift("Games");
        }
        setCategories(uniqueCats);
    };

    const getBrandsByCategory = (cat: string) => {
        const filtered = allProducts.filter((p) => p.category === cat);
        return Array.from(new Set(filtered.map((p) => p.brand))).sort();
    };

    // --- SINKRONISASI ---
    // Contoh di app/page.tsx atau layout.tsx
const handleUpdateClick = async () => {
    try {
        // Ambil session untuk mendapatkan username
        const username = localStorage.username;

        if (!username) {
            alert("Sesi berakhir, silakan login kembali");
            return false;
        }

        const res = await fetch("/api/digi/pricelist", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ username }) // DATA INI YANG DITUNGGU SERVER
        });

        const result = await res.json();
        if (result.success) {
            alert("Data produk berhasil diperbarui!");
            return true;
        } else {
            alert("Gagal update: " + result.message);
            return false;
        }
    } catch (error) {
        console.error("Error updating pricelist:", error);
        return false;
    }
};
    // --- INTERAKSI USER ---

    const handleBrandClick = (brand: string, category: string) => {
        setSelectedBrand(brand);
        setSelectedCategory(category);

        const products = allProducts
            .filter((p) => p.brand === brand && p.category === category)
            .sort((a, b) => a.price - b.price);

        setBrandProducts(products);

        setUserId("");
        setServerId("");
        setSelectedSku(null);
        setNickname("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCheckId = async () => {
        if (!userId) return showNotification("Masukkan ID dulu!", "info");
        if (selectedBrand === "MOBILE LEGENDS" && !serverId)
            return showNotification("Masukkan Server ID!", "info");

        setIsCheckingId(true);
        setNickname("");

        try {
            const res = await fetch("/api/digi/check-id", {
                method: "POST",
                body: JSON.stringify({
                    game: selectedBrand,
                    userId,
                    zoneId: serverId,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNickname(data.nickname);
                showNotification(`Valid: ${data.nickname}`, "success");
            } else {
                showNotification("User tidak ditemukan!", "error");
            }
        } catch (e) {
            showNotification("Gagal mengecek ID.", "error");
        } finally {
            setIsCheckingId(false);
        }
    };

    // --- LOGIKA TRANSAKSI BARU (DENGAN MODAL) ---

    const openPinModal = () => {
        if (!selectedSku) return showNotification("Pilih produk dulu!", "info");
        if (!userId) return showNotification("Masukkan ID Tujuan!", "info");
        if (isMLBB && !serverId)
            return showNotification("Masukkan Server ID!", "info");

        setPin("");
        setIsPinModalOpen(true);
    };

    const handleConfirmTransaction = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setIsPinModalOpen(false);
        setIsProcessing(true);

        let customerNo = userId;
        if (selectedBrand === "MOBILE LEGENDS") customerNo = userId + serverId;

        const refId = "TRX-" + Math.floor(Math.random() * 1000000);

        try {
            const res = await fetch("/api/digi/transaction", {
                method: "POST",
                body: JSON.stringify({
                    buyer_sku_code: selectedSku,
                    customer_no: customerNo,
                    ref_id: refId,
                    pin: pin,
                }),
            });
            const result = await res.json();

            if (result.success) {
                const msg = result.message.toLowerCase();
                const isPending =
                    msg.includes("pending") || msg.includes("proses");

                if (isPending) {
                    showNotification(result.message, "info");
                } else {
                    showNotification(result.message, "success");
                }

                setTimeout(() => {
                    window.location.href = "/riwayat";
                }, 2000);
            } else {
                showNotification(`Gagal: ${result.message}`, "error");
            }
        } catch (e) {
            showNotification("Terjadi kesalahan koneksi.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const isMLBB = selectedBrand === "MOBILE LEGENDS";
    const isGameCategory = selectedCategory === "Games";

    const canCheckId =
        isGameCategory &&
        (selectedBrand === "MOBILE LEGENDS" ||
            selectedBrand === "FREE FIRE" ||
            selectedBrand === "HONOR OF KINGS");

    const getInputLabel = () => {
        if (isGameCategory) return isMLBB ? "User ID" : "User ID / Player ID";
        if (selectedCategory === "Pulsa" || selectedCategory === "Data")
            return "Nomor HP (08xx)";
        if (selectedCategory === "PLN") return "No. Meter / ID Pelanggan";
        if (selectedCategory === "E-Money") return "Nomor HP Terdaftar";
        return "Nomor Tujuan";
    };

    const getBrandImage = (brand: string) => {
        const lower = brand.toLowerCase();

        // Games
        if (lower.includes("mobile legend")) return "/games/mobile-legends.png";
        if (lower.includes("free fire")) return "/games/free-fire.png";
        if (lower.includes("pubg")) return "/games/pubg-mobile.png";
        if (lower.includes("valorant")) return "/games/valorant.png";
        if (lower.includes("genshin")) return "/games/genshin-impact.png";
        if (lower.includes("call of duty"))
            return "/games/call-of-duty-mobile.png";
        if (lower.includes("honor of kings"))
            return "/games/honor-of-kings.png";
        if (lower.includes("arena breakout"))
            return "/games/arena-breakout.png";
        if (lower.includes("metal slug")) return "/games/metal-slug.png";
        if (lower.includes("point blank")) return "/games/point-blank.png";

        // Pulsa & Data
        if (lower.includes("telkomsel")) return "/pulsa/telkomsel.png";
        if (lower.includes("indosat")) return "/pulsa/indosat.png";
        if (lower.includes("xl")) return "/pulsa/xl.png";
        if (lower.includes("axis")) return "/pulsa/axis.png";
        if (lower.includes("tri") || lower.includes("three"))
            return "/pulsa/tri.png";
        if (lower.includes("smartfren")) return "/pulsa/smartfren.png";

        // PLN & E-Money
        if (lower.includes("pln")) return "/pln/pln.png";
        if (lower.includes("dana")) return "/e-money/dana.png";
        if (lower.includes("go pay")) return "/e-money/go-pay.png";
        if (lower.includes("linkaja")) return "/e-money/link-aja.png";
        if (lower.includes("shopee")) return "/e-money/shopee.png";

        return `https://placehold.co/300x400/18181b/FFF?text=${brand.substring(
            0,
            3
        )}`;
    };

    return (
        <div className="min-h-screen text-white pb-20">
            <Navbar username={username} onUpdateClick={handleUpdateClick} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {!selectedBrand ? (
                    // ================= HALAMAN DEPAN (LIST BRAND) =================
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <BannerSlider />

                        {/* --- SEARCH BAR --- */}
                        <div className="relative max-w-xl mx-auto mb-10">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-12 pr-4 py-4 bg-[#18181b] border border-gray-700 rounded-2xl leading-5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-[#18181b] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all shadow-lg"
                                placeholder="Cari Game, Pulsa, atau E-Money..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* --- LIST KATEGORI VERTIKAL --- */}
                        {allProducts.length > 0 ? (
                            categories.map((category) => {
                                const brands = getBrandsByCategory(
                                    category
                                ).filter((b) =>
                                    b
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase())
                                );

                                if (brands.length === 0) return null;

                                return (
                                    <div
                                        key={category}
                                        className="mb-12 animate-in slide-in-from-bottom-4"
                                    >
                                        <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                                            <div
                                                className={`w-1.5 h-8 rounded-full shadow-[0_0_15px] ${
                                                    category === "Games"
                                                        ? "bg-blue-600 shadow-blue-600/50"
                                                        : category === "Pulsa"
                                                        ? "bg-green-600 shadow-green-600/50"
                                                        : category === "E-Money"
                                                        ? "bg-purple-600 shadow-purple-600/50"
                                                        : "bg-gray-600"
                                                }`}
                                            ></div>
                                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                                {category}
                                            </h2>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded ml-2">
                                                {brands.length}
                                            </span>
                                        </div>

                                        {/* Grid Seragam */}
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
                                            {brands.map((brand, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() =>
                                                        handleBrandClick(
                                                            brand,
                                                            category
                                                        )
                                                    }
                                                    className="group relative bg-[#18181b] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] hover:-translate-y-1"
                                                >
                                                    <div className="aspect-[3/4] w-full overflow-hidden relative">
                                                        <img
                                                            src={getBrandImage(
                                                                brand
                                                            )}
                                                            alt={brand}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                                                    </div>
                                                    <div className="absolute bottom-0 w-full p-3 text-center z-10">
                                                        <p className="text-xs sm:text-sm font-bold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-1 shadow-black drop-shadow-md">
                                                            {brand}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-3xl bg-[#18181b]/50">
                                <p className="text-gray-500 text-lg mb-2">
                                    Belum ada data produk.
                                </p>
                                <p className="text-gray-600 text-sm">
                                    Klik profil di pojok kanan atas, lalu pilih
                                    "Sinkronisasi Data".
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    // ================= HALAMAN ORDER (DETAIL) =================
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-8 duration-500 relative">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-[#18181b]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 sticky top-24 shadow-xl">
                                <div className="flex gap-5 items-start">
                                    <img
                                        src={getBrandImage(selectedBrand)}
                                        className="aspect-[3/4] w-24 rounded-xl shadow-lg object-cover"
                                    />
                                    <div>
                                        <h1 className="text-xl font-bold leading-tight">
                                            {selectedBrand}
                                        </h1>
                                        <p className="text-blue-400 text-xs mt-1 font-medium bg-blue-500/10 inline-block px-2 py-1 rounded border border-blue-500/20">
                                            {selectedCategory}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-800">
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {isGameCategory
                                            ? "Layanan Top Up otomatis 24 Jam. Masukkan ID dengan benar."
                                            : "Pastikan nomor tujuan benar. Kesalahan input nomor bukan tanggung jawab kami."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedBrand(null)}
                                    className="mt-6 w-full py-3 rounded-xl border border-gray-700 hover:bg-gray-800 transition text-sm font-medium"
                                >
                                    ← Kembali ke Beranda
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-[#18181b]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 bg-blue-600 px-4 py-2 rounded-br-2xl text-xs font-bold shadow-lg shadow-blue-600/20 z-10">
                                    1. Masukkan Tujuan
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div
                                        className={`space-y-2 ${
                                            isMLBB ? "" : "col-span-2"
                                        }`}
                                    >
                                        <label className="text-xs text-gray-400 ml-1">
                                            {getInputLabel()}
                                        </label>
                                        <input
                                            type={
                                                isGameCategory
                                                    ? "text"
                                                    : "number"
                                            }
                                            placeholder={getInputLabel()}
                                            className="w-full bg-[#0a0a0b] border border-gray-700 p-4 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            value={userId}
                                            onChange={(e) =>
                                                setUserId(e.target.value)
                                            }
                                        />
                                    </div>
                                    {isMLBB && (
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 ml-1">
                                                Server ID
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="(Zone ID)"
                                                className="w-full bg-[#0a0a0b] border border-gray-700 p-4 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={serverId}
                                                onChange={(e) =>
                                                    setServerId(e.target.value)
                                                }
                                            />
                                        </div>
                                    )}
                                </div>

                                {canCheckId && (
                                    <div className="mt-4 flex items-center justify-between bg-[#0a0a0b] p-3 rounded-xl border border-gray-800">
                                        <p className="text-xs text-gray-500">
                                            Cek nama akun sebelum membeli.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            {nickname && (
                                                <span className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                                                    {nickname}
                                                </span>
                                            )}
                                            <button
                                                onClick={handleCheckId}
                                                disabled={isCheckingId}
                                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-blue-600/20"
                                            >
                                                {isCheckingId ? "..." : "Check"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#18181b]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 bg-blue-600 px-4 py-2 rounded-br-2xl text-xs font-bold shadow-lg shadow-blue-600/20 z-10">
                                    2. Pilih Produk
                                </div>

                                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {brandProducts.map((p) => (
                                        <div
                                            key={p.buyer_sku_code}
                                            onClick={() =>
                                                setSelectedSku(p.buyer_sku_code)
                                            }
                                            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 group overflow-hidden ${
                                                selectedSku === p.buyer_sku_code
                                                    ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-blue-500"
                                                    : "bg-[#0a0a0b] border-gray-800 hover:border-gray-600 hover:bg-gray-800/50"
                                            }`}
                                        >
                                            <div className="relative z-10">
                                                <p className="text-xs text-gray-500 mb-1 line-clamp-2">
                                                    {p.product_name
                                                        .replace(
                                                            selectedBrand,
                                                            ""
                                                        )
                                                        .trim()}
                                                </p>
                                                <div className="mt-2 flex items-center justify-between pt-2 border-t border-gray-800">
                                                    <p className="text-sm font-bold text-blue-400">
                                                        Rp{" "}
                                                        {p.price.toLocaleString(
                                                            "id-ID"
                                                        )}
                                                    </p>
                                                    {selectedSku ===
                                                        p.buyer_sku_code && (
                                                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <svg
                                                                className="w-2.5 h-2.5 text-white"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        3
                                                                    }
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedSku ===
                                                p.buyer_sku_code && (
                                                <div className="absolute inset-0 bg-blue-600/5 pointer-events-none"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={openPinModal}
                                disabled={
                                    !selectedSku ||
                                    !userId ||
                                    (isMLBB && !serverId) ||
                                    isProcessing
                                }
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-5 rounded-2xl font-bold text-lg text-white shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isProcessing
                                    ? "Memproses Transaksi..."
                                    : "Beli Sekarang"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ================= MODAL PIN (POPUP) ================= */}
                {isPinModalOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        {/* Backdrop Blur */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                            onClick={() => setIsPinModalOpen(false)}
                        ></div>

                        {/* Modal Content */}
                        <div className="bg-[#18181b] border border-gray-700 rounded-2xl p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300 transform scale-100">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-8 w-8 text-blue-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    Konfirmasi Transaksi
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    Masukkan PIN keamanan Anda untuk melanjutkan
                                    pembelian.
                                </p>
                            </div>

                            <form
                                onSubmit={handleConfirmTransaction}
                                className="space-y-4"
                            >
                                <div>
                                    <input
                                        ref={pinInputRef}
                                        type="password"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        className="w-full bg-[#0a0a0b] border border-gray-600 text-center text-2xl font-bold tracking-widest p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white transition-all placeholder-gray-700"
                                        placeholder="******"
                                        maxLength={6}
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsPinModalOpen(false)}
                                        className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition border border-gray-700"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!pin}
                                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Konfirmasi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
