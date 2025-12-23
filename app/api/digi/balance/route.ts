import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/utils/db';

export async function POST(request: Request) { // Menambahkan parameter request agar bisa membaca body
  try {
    // 1. Ambil username dari body request (dikirim dari frontend)
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ success: false, message: 'Username diperlukan' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // 2. Ambil kredensial spesifik user dari MongoDB
    const user = await db.collection('users').findOne({ username });
    
    if (!user || !user.digi_username || !user.digi_key) {
      return NextResponse.json({ 
        success: false, 
        message: 'Konfigurasi Digiflazz user tidak ditemukan' 
      }, { status: 404 });
    }

    // 3. Buat Signature MD5 menggunakan data dari DB
    // Format Digiflazz: md5(username + APIkey + "depo")
    const signature = crypto.createHash('md5')
      .update(user.digi_username + user.digi_key + "depo")
      .digest('hex');

    const payload = {
      cmd: "deposit",
      username: user.digi_username,
      sign: signature
    };

    // 4. Kirim request ke API Digiflazz
    const res = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-App/1.0'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const data = await res.json();

    // 5. Kembalikan respon ke frontend
    if (data.data) {
        return NextResponse.json({
            success: true,
            balance: data.data.deposit, // Digiflazz mengembalikan saldo dalam field 'deposit'
        });
    } else {
        return NextResponse.json({ 
            success: false, 
            message: data.message || 'Gagal mengambil data saldo dari Digiflazz' 
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Balance Check Error:', error);
    return NextResponse.json({ 
        success: false, 
        message: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}