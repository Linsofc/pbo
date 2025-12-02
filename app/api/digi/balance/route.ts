import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST() {
  try {
    const username = process.env.DIGI_USERNAME;
    const key = process.env.DIGI_KEY;

    if (!username || !key) {
      return NextResponse.json({ success: false, message: 'Konfigurasi Server Belum Lengkap' });
    }

    // 1. Generate Signature Khusus Cek Saldo
    // Rumus: md5(username + key + "depo")
    const signature = crypto.createHash('md5')
      .update(username + key + "depo")
      .digest('hex');

    // 2. Request ke Digiflazz
    const payload = {
      cmd: "deposit",
      username: username,
      sign: signature
    };

    const res = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // 3. Response Handling
    if (data.data) {
        return NextResponse.json({
            success: true,
            // Digiflazz mengembalikan saldo dalam field 'deposit'
            balance: data.data.deposit, 
        });
    } else {
        return NextResponse.json({ success: false, message: data.message || 'Gagal cek saldo' });
    }

  } catch (error) {
    console.error('Balance Check Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' });
  }
}