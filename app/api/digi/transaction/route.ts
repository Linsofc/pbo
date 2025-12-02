import { NextResponse } from 'next/server';
import crypto from 'crypto'; 
import { sendLogToBackend } from '@/utils/logger'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyer_sku_code, customer_no, ref_id } = body;

    const username = process.env.DIGI_USERNAME;
    const key = process.env.DIGI_KEY;

    if (!username || !key) {
      return NextResponse.json({ success: false, message: 'Konfigurasi Server Belum Lengkap' });
    }

    // 1. Generate Signature
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

    // 3. Validasi Response
    if (data.data) {
        const { status, sn, rc, message } = data.data; // Ambil RC & Status
        const serialNumber = sn || '';

        // --- UPDATE LOGIC LOGGING ---
        // Format Log: [STATUS] Order REF - SKU. Info Tambahan | CUSTOMER_NO
        // Customer No di bagian akhir dipisah '|' sangat penting untuk Auto-Update Status

        // RC 00 = Sukses Mutlak
        if (rc === '00' || status === 'Sukses') {
            await sendLogToBackend('transaction', `[SUCCESS] Order ${ref_id} - ${buyer_sku_code}. SN: ${serialNumber} | ${customer_no}`);
            
            return NextResponse.json({ 
                success: true, 
                message: 'Transaksi Berhasil', 
                data: data.data 
            });
        
        // RC 03 = Pending (Jangan dicatat Success!)
        } else if (rc === '03' || status === 'Pending') {
            await sendLogToBackend('transaction', `[PENDING] Order ${ref_id} - ${buyer_sku_code}. Status diproses | ${customer_no}`);
            
            return NextResponse.json({ 
                success: true, 
                message: 'Transaksi Pending (Sedang Diproses)', 
                data: data.data 
            });

        // Sisanya = GAGAL (Saldo kurang, gangguan, no salah, dll)
        } else {
            await sendLogToBackend('transaction', `[FAILED] Order ${ref_id} - ${buyer_sku_code}. Reason: ${message} | ${customer_no}`);
            
            return NextResponse.json({ success: false, message: message || 'Transaksi Gagal' });
        }

    } else {
        // Error Sistem/API (Response tidak standar)
        await sendLogToBackend('error', `[API ERROR] Digiflazz invalid: ${data.message}`);
        return NextResponse.json({ success: false, message: data.message || 'Error Digiflazz' });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Server Error' });
  }
}