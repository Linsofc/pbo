// app/api/history/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Ambil data transaksi dari MongoDB
    const transactions = await db.collection("transactions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Mapping data agar sesuai dengan interface di frontend
    const data = transactions.map(t => ({
      id: t._id.toString(),
      date: t.createdAt,
      status: t.status,
      ref_id: t.ref_id,
      customer_no: t.customer_no,
      buyer_sku_code: t.buyer_sku_code,
      sn: t.sn,
      price: t.price || 0,
      message: t.message
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Gagal memuat data" }, { status: 500 });
  }
}