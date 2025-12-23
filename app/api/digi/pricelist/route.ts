import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/utils/db';

export async function POST(request: Request) {
  try {
    // Validasi apakah body ada dan bisa di-parse
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Body request kosong atau tidak valid' }, { status: 400 });
    }

    const { username } = body;
    if (!username) {
      return NextResponse.json({ success: false, message: 'Username diperlukan' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Ambil kredensial user dari MongoDB
    const user = await db.collection('users').findOne({ username });
    if (!user || !user.digi_username || !user.digi_key) {
      return NextResponse.json({ success: false, message: 'Konfigurasi Digiflazz user tidak ditemukan' }, { status: 404 });
    }

    const signature = crypto.createHash('md5')
      .update(user.digi_username + user.digi_key + "pricelist")
      .digest('hex');

    const res = await fetch('https://api.digiflazz.com/v1/price-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cmd: "prepaid",
        username: user.digi_username,
        sign: signature
      }),
    });

    const result = await res.json();

    if (result.data && Array.isArray(result.data)) {
      await db.collection('products').updateOne(
        { owner: username },
        { $set: { data: result.data, updatedAt: new Date() } },
        { upsert: true }
      );
      return NextResponse.json({ success: true, data: result.data });
    }
    
    return NextResponse.json({ success: false, message: result.message || 'Gagal mengambil data dari Digiflazz' }, { status: 400 });

  } catch (error: any) {
    console.error("Pricelist Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}