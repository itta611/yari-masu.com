import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

interface Reservation {
  id: string;
  createdAt: string;
  reservationTime: string;
}

export async function POST() {
  try {
    // 全ての予約IDを時系列順で取得
    const allReservationIds = await kv.zrange("reservations", 0, -1);
    
    if (allReservationIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No reservations found"
      }, { status: 404 });
    }

    // 最初の予約（現在のターン）を削除
    const currentReservationId = allReservationIds[0];
    
    // 予約データを削除
    await kv.del(`reservation:${currentReservationId}`);
    
    // 予約リストから削除
    await kv.zrem("reservations", currentReservationId);
    
    return NextResponse.json({
      success: true,
      removedId: currentReservationId,
      message: "Moved to next turn successfully"
    });
  } catch (error) {
    console.error("Failed to move to next turn:", error);
    return NextResponse.json(
      { success: false, error: "Failed to move to next turn" },
      { status: 500 }
    );
  }
}