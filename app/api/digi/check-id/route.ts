import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { game, userId, zoneId } = await request.json();

  // API Publik Gratisan (Bisa diganti jika punya API Paid sendiri)
  let apiUrl = '';
  
  if (game === 'MOBILE LEGENDS') {
    apiUrl = `https://api.isan.eu.org/nickname/ml?id=${userId}&server=${zoneId}`;
  } else if (game === 'FREE FIRE') {
    apiUrl = `https://api.isan.eu.org/nickname/ff?id=${userId}`;
  } else {
    return NextResponse.json({ success: false, message: 'Game tidak didukung cek ID' });
  }

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.success) {
      return NextResponse.json({ success: true, nickname: data.name });
    } else {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Gagal mengecek ID' });
  }
}