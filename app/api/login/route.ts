import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const { db } = await connectToDatabase();

    // Cari user di database berdasarkan username dan password
    const user = await db.collection('users').findOne({ username, password });

    if (user) {
      // Jangan kirim password kembali ke client
      return NextResponse.json({ 
        success: true, 
        message: 'Login Berhasil',
        user: {
          username: user.username,
          digi_username: user.digi_username
        }
      });
    } else {
      return NextResponse.json({ success: false, message: 'Username atau Password salah' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}