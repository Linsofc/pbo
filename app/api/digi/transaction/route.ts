import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Bawaan Node.js untuk MD5
import { sendLogToBackend } from '@/utils/logger'; // Helper log ke Python

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyer_sku_code, customer_no, ref_id } = body;

    const username = process.env.DIGI_USERNAME;
    const key = process.env.DIGI_KEY;

    if (!username || !key) {
      return NextResponse.json({ success: false, message: 'Konfigurasi Server Belum Lengkap' });
    }

    // 1. Generate Signature Digiflazz (md5(username + key + ref_id))
    const signature = crypto.createHash('md5')
      .update(username + key + ref_id)
      .digest('hex');

    // 2. Request ke Digiflazz
    const digiPayload = {
      username: username,
      buyer_sku_code: buyer_sku_code,
      customer_no: customer_no,
      ref_id: ref_id,
      sign: signature,
    };

    const res = await fetch('https://api.digiflazz.com/v1/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(digiPayload),
    });

    const data = await res.json();

    // 3. Logika Response & Logging ke Python
    if (data.data) {
        const status = data.data.status;
        const sn = data.data.sn || '';
        const message = data.data.message;

        if (status === 'Sukses' || status === 'Pending') {
            // Log SUKSES ke Python
            await sendLogToBackend('transaction', `[SUCCESS] Order ${ref_id} - ${buyer_sku_code} ke ${customer_no}. SN: ${sn}`);
            
            return NextResponse.json({ 
                success: true, 
                message: 'Transaksi Berhasil/Pending', 
                data: data.data 
            });
        } else {
            // Log GAGAL ke Python
            await sendLogToBackend('error', `[FAILED] Order ${ref_id} - ${buyer_sku_code}. Reason: ${message}`);
            
            return NextResponse.json({ success: false, message: message || 'Transaksi Gagal' });
        }
    } else {
        // Error dari API Digiflazz (misal Saldo kurang/IP salah)
        await sendLogToBackend('error', `[API ERROR] Digiflazz response invalid: ${JSON.stringify(data)}`);
        return NextResponse.json({ success: false, message: data.message || 'Error Digiflazz' });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Server Error' });
  }
}