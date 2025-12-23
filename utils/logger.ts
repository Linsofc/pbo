// utils/logger.ts
// JANGAN impor connectToDatabase di sini jika file ini dipakai di 'use client'

type LogType = 'transaction' | 'auth' | 'system' | 'error';

export const sendLogToBackend = async (type: LogType, message: string) => {
  try {
    // Kita panggil API route internal Next.js agar MongoDB diproses di sisi server
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message }),
    });
  } catch (error) {
    console.warn('[LOG ERROR] Gagal mengirim log ke API');
  }
};