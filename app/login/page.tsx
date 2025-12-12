"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendLogToBackend } from "@/utils/logger";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        if (isLoggedIn) {
            router.replace("/"); 
        } else {
            setIsCheckingAuth(false); 
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("username", username);
                await sendLogToBackend(
                    "auth",
                    `User '${username}' berhasil login.`
                );

                router.push("/");
            } else {
                setError(data.message || "Login gagal");
                sendLogToBackend("auth", `Gagal login: ${username}`);
            }
        } catch (err) {
            setError("Terjadi kesalahan jaringan.");
        } finally {
            setLoading(false);
        }
    };

    if (isCheckingAuth) {
        return null; 
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-sm p-8 bg-[#18181b]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800 z-10 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center mb-6">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 mb-4 shadow-lg shadow-blue-500/20">
                        <img
                            src="/logos/logo.png"
                            alt="Linsofc Logo"
                            className="w-full h-full rounded-full bg-[#0a0a0b] object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                    "none";
                            }}
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Masuk ke Linsofc Store
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full mt-1 px-4 py-3 bg-[#0a0a0b] border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-600 transition-all"
                            placeholder="Username Admin"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 px-4 py-3 bg-[#0a0a0b] border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-600 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Memproses...
                            </span>
                        ) : (
                            "Masuk Dashboard"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
