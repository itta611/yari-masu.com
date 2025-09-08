import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    // 全ての予約IDを取得
    const allReservationIds = await kv.zrange("reservations", 0, -1);
    
    // 各予約データを削除
    for (const resId of allReservationIds) {
      await kv.del(`reservation:${resId}`);
    }
    
    // 予約リストをクリア
    await kv.del("reservations");
    
    return NextResponse.json({
      success: true,
      message: "All reservations cleared successfully",
      deletedCount: allReservationIds.length
    });
  } catch (error) {
    console.error("Failed to clear all reservations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear all reservations" },
      { status: 500 }
    );
  }
}