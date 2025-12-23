import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { ObjectId } from 'mongodb';

// Ambil semua daftar user
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Tambah user baru (Pengganti .env)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, pintrx, digi_username, digi_key } = body;

    if (!username || !password || !pintrx || !digi_username || !digi_key) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Cek duplikasi
    const existing = await db.collection('users').findOne({ username });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Username sudah terdaftar' }, { status: 400 });
    }

    await db.collection('users').insertOne({
      username,
      password, // Password teks biasa (disarankan pakai bcrypt jika ingin lebih aman)
      pintrx,
      digi_username,
      digi_key,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, message: 'User berhasil dibuat' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Hapus User
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID diperlukan' });

    const { db } = await connectToDatabase();
    await db.collection('users').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: 'User dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}