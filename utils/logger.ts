type LogType = 'transaction' | 'auth' | 'system' | 'error';

export const sendLogToBackend = async (type: LogType, message: string) => {
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
      cache: 'no-store',
    });
  } catch (error) {
    console.warn('[PYTHON LOGGING OFF] Gagal mengirim log ke backend. Pastikan main.py berjalan.');
  }
};