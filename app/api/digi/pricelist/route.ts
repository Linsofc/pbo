import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendLogToBackend } from '@/utils/logger';

export async function POST() {
  try {
    const username = process.env.DIGI_USERNAME || process.env.DIGI_USER;
    const apiKey = process.env.DIGI_KEY || process.env.DIGI_API;

    if (!username || !apiKey) {
      return NextResponse.json({ success: false, message: 'Konfigurasi Server Belum Lengkap' }, { status: 500 });
    }

    const signature = crypto.createHash('md5')
      .update(username + apiKey + "pricelist")
      .digest('hex');

    const payload = {
      cmd: "prepaid",
      username: username,
      sign: signature
    };

    const res = await fetch('https://api.digiflazz.com/v1/price-list', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-App/1.0'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const result = await res.json();

    // --- LOGIKA VALIDASI BARU ---
    
    // 1. Cek apakah ada Data Produk valid
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        
        // Log sukses
        await sendLogToBackend('system', `[SUCCESS] Berhasil memperbarui ${result.data.length} produk.`);
        
        return NextResponse.json({
            success: true,
            data: result.data, 
        });

    } else {
        // 2. Cek Error Spesifik (Limitasi / Saldo / IP)
        const errorMsg = result.message || 'Gagal mengambil data dari Digiflazz';
        const errorCode = result.rc || 'UNKNOWN';

        // Jika kena limit (RC 83) atau error lain, catat ke ERROR LOG
        console.error(`[API FAILED] RC: ${errorCode} - ${errorMsg}`);
        await sendLogToBackend('error', `[PRICELIST FAILED] RC:${errorCode} - ${errorMsg}`);
        
        return NextResponse.json({ 
            success: false, 
            message: errorMsg,
            rc: errorCode 
        }, { status: 400 });
    }

  } catch (error: any) {
    const errorMsg = error.message || 'Unknown Server Error';
    await sendLogToBackend('error', `[SYSTEM ERROR] Pricelist Route Crash: ${errorMsg}`);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}