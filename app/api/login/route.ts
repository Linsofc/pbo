// app/api/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Ambil data rahasia dari .env.local (hanya server yang bisa baca ini)
    const ENV_USERNAME = process.env.ADMIN_USERNAME;
    const ENV_PASSWORD = process.env.ADMIN_PASSWORD;

    // Logika Validasi Sederhana
    if (username === ENV_USERNAME && password === ENV_PASSWORD) {
      
      // Jika sukses, kembalikan respon OK
      return NextResponse.json({ success: true, message: 'Login Berhasil' });
    } else {
      
      // Jika gagal
      return NextResponse.json({ success: false, message: 'Username atau Password salah' }, { status: 401 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}