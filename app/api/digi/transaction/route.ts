import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendLogToBackend } from "@/utils/logger";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { buyer_sku_code, customer_no, ref_id, pin } = body;

        const username = process.env.DIGI_USERNAME;
        const key = process.env.DIGI_KEY;
        const trxPin = process.env.TRANSACTION_PIN;

        if (pin !== trxPin) {
            return NextResponse.json({
                success: false,
                message: "PIN Transaksi Salah",
            });
        }

        if (!username || !key) {
            return NextResponse.json({
                success: false,
                message: "Konfigurasi Server Belum Lengkap",
            });
        }

        const signature = crypto
            .createHash("md5")
            .update(username + key + ref_id)
            .digest("hex");

        const digiPayload = {
            username: username,
            buyer_sku_code: buyer_sku_code,
            customer_no: customer_no,
            ref_id: ref_id,
            sign: signature,
        };

        const res = await fetch("https://api.digiflazz.com/v1/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(digiPayload),
        });

        const data = await res.json();

        if (data.data) {
            const { status, sn, rc, message } = data.data;
            const serialNumber = sn || "";

            if (rc === "00" || status === "Sukses") {
                await sendLogToBackend(
                    "transaction",
                    `[SUCCESS] Order ${ref_id} - ${buyer_sku_code}. SN: ${serialNumber} | ${customer_no}`
                );

                return NextResponse.json({
                    success: true,
                    message: "Transaksi Berhasil",
                    data: data.data,
                });
            } else if (rc === "03" || status === "Pending") {
                await sendLogToBackend(
                    "transaction",
                    `[PENDING] Order ${ref_id} - ${buyer_sku_code}. Status diproses | ${customer_no}`
                );

                return NextResponse.json({
                    success: true,
                    message: "Transaksi Pending (Sedang Diproses)",
                    data: data.data,
                });
            } else {
                await sendLogToBackend(
                    "transaction",
                    `[FAILED] Order ${ref_id} - ${buyer_sku_code}. Reason: ${message} | ${customer_no}`
                );

                return NextResponse.json({
                    success: false,
                    message: message || "Transaksi Gagal",
                });
            }
        } else {
            await sendLogToBackend(
                "error",
                `[API ERROR] Digiflazz invalid: ${data.message}`
            );
            return NextResponse.json({
                success: false,
                message: data.message || "Error Digiflazz",
            });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Server Error" });
    }
}
