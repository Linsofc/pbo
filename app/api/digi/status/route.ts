import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendLogToBackend } from '@/utils/logger';

export async function POST(request: Request) {
  try {
    // Menerima data dari frontend (hasil parsing log)
    const { ref_id, buyer_sku_code, customer_no } = await request.json();
    
    const username = process.env.DIGI_USERNAME;
    const key = process.env.DIGI_KEY;

    // Validasi kelengkapan data
    if (!username || !key || !ref_id || !customer_no || !buyer_sku_code) {
        return NextResponse.json({ success: false, message: 'Data checking tidak lengkap' });
    }

    // 1. Generate Signature (Sama persis seperti saat Transaksi)
    // Rumus Digiflazz: md5(username + key + ref_id)
    const signature = crypto.createHash('md5')
      .update(username + key + ref_id)
      .digest('hex');

    // 2. Request ke Digiflazz (Endpoint Transaction bersifat Idempotent)
    // Artinya aman dipanggil ulang untuk cek status
    const res = await fetch('https://api.digiflazz.com/v1/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        buyer_sku_code: buyer_sku_code,
        customer_no: customer_no,
        ref_id: ref_id,
        sign: signature,
      }),
    });

    const result = await res.json();
    
    if (result.data) {
        const { rc, sn, message } = result.data;
        
        // --- LOGIKA UPDATE STATUS ---
        
        // Jika status berubah jadi SUKSES (RC 00)
        if (rc === '00') {
            // Kita catat log [SUCCESS] baru. 
            // Karena frontend menampilkan log terbaru berdasarkan Ref ID, status PENDING lama akan tertimpa secara visual.
            await sendLogToBackend('transaction', `[SUCCESS] Order ${ref_id} - ${buyer_sku_code}. SN: ${sn} | ${customer_no}`);
            
            return NextResponse.json({ success: true, status: 'SUCCESS', message: 'Transaksi Berhasil' });
        }
        
        // Jika status berubah jadi GAGAL (Bukan 00 dan Bukan 03 Pending)
        else if (rc !== '03') {
            await sendLogToBackend('transaction', `[FAILED] Order ${ref_id} - ${buyer_sku_code}. Reason: ${message} | ${customer_no}`);
            return NextResponse.json({ success: true, status: 'FAILED', message: message });
        }
        
        // Jika masih RC 03, berarti masih PENDING
        return NextResponse.json({ success: true, status: 'PENDING', message: 'Masih Pending' });
    }

    return NextResponse.json({ success: false, message: 'Gagal koneksi ke provider' });

  } catch (error) {
    console.error("Status Check Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' });
  }
}