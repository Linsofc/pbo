import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/utils/db";

export async function POST(request: Request) {
    try {
        const { buyer_sku_code, customer_no, ref_id, pin, username } = await request.json();
        const { db } = await connectToDatabase();

        // 1. Ambil data user pembeli
        const user = await db.collection('users').findOne({ username });
        if (!user) return NextResponse.json({ success: false, message: "Akses Ditolak" });

        // 2. Validasi PIN dari Database
        if (pin !== user.pintrx) {
            return NextResponse.json({ success: false, message: "PIN Transaksi Salah" });
        }

        const signature = crypto.createHash("md5")
            .update(user.digi_username + user.digi_key + ref_id)
            .digest("hex");

        const res = await fetch("https://api.digiflazz.com/v1/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user.digi_username,
                buyer_sku_code,
                customer_no,
                ref_id,
                sign: signature,
            }),
        });

        const data = await res.json();

        if (data.data) {
            // Simpan transaksi dengan identitas pemilik (owner)
            await db.collection("transactions").insertOne({
                ...data.data,
                owner: username,
                createdAt: new Date(),
            });

            return NextResponse.json({ success: true, data: data.data });
        } else {
            return NextResponse.json({ success: false, message: data.message });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server Error" });
    }
}