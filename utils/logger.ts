type LogType = 'transaction' | 'auth' | 'system' | 'error';

export const sendLogToBackend = async (type: LogType, message: string) => {
  // Ambil URL dari env atau default ke 127.0.0.1
  const BACKEND_URL = process.env.NEXT_PUBLIC_LOGGER_URL || 'http://127.0.0.1:5000/api/log';

  try {
    await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type,
        message: message,
      }),
      cache: 'no-store', // Mencegah caching agar log selalu baru
    });
  } catch (error) {
    // Gunakan warn agar tidak dianggap error fatal di console
    console.warn('[PYTHON LOGGING OFF] Gagal mengirim log ke backend. Pastikan main.py berjalan.');
  }
};