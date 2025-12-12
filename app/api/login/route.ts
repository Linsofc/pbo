import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const ENV_USERNAME = process.env.ADMIN_USERNAME;
    const ENV_PASSWORD = process.env.ADMIN_PASSWORD;

    if (username === ENV_USERNAME && password === ENV_PASSWORD) {
      
      return NextResponse.json({ success: true, message: 'Login Berhasil' });
    } else {
      
      return NextResponse.json({ success: false, message: 'Username atau Password salah' }, { status: 401 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}