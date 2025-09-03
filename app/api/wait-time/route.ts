import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

interface Reservation {
  id: string;
  createdAt: string;
  reservationTime: string;
}

export async function GET() {
  try {
    // 最新の予約を取得
    const latestReservationIds = await kv.zrange("reservations", 0, 0, {
      rev: true,
    });

    const now = new Date();
    let waitTimeMinutes = 0;

    if (latestReservationIds.length > 0) {
      // 最新の予約を取得
      const latestReservation = await kv.get<Reservation>(
        `reservation:${latestReservationIds[0]}`
      );

      if (latestReservation?.reservationTime) {
        // 最新の予約の終了時間（reservationTime + 2分）
        const latestEndTime = new Date(latestReservation.reservationTime);
        latestEndTime.setMinutes(latestEndTime.getMinutes() + 2);

        if (latestEndTime > now) {
          // 待ち時間を計算（ミリ秒を分に変換）
          const waitTimeMs = latestEndTime.getTime() - now.getTime();
          waitTimeMinutes = Math.ceil(waitTimeMs / 60000);
        }
      }
    }

    return NextResponse.json({
      success: true,
      waitTimeMinutes,
      currentTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to calculate wait time:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate wait time" },
      { status: 500 }
    );
  }
}