import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

interface Reservation {
  id: string;
  createdAt: string;
  reservationTime: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    // 指定IDの予約を取得
    const reservation = await kv.get<Reservation>(`reservation:${id}`);
    
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    
    // 予約が期限切れかチェック（予約時間 + 2分）
    const reservationEndTime = new Date(reservation.reservationTime);
    reservationEndTime.setMinutes(reservationEndTime.getMinutes() + 2);
    const isExpired = reservationEndTime < now;
    
    // 前に何人いるか計算
    let queuePosition = 0;
    
    // 自分のターンが完全に終了している場合は-1を返す
    if (isExpired) {
      queuePosition = -1;
    } else {
      // 全ての予約IDを時系列順で取得
      const allReservationIds = await kv.zrange("reservations", 0, -1);
      
      for (const resId of allReservationIds) {
        if (resId === id) {
          break;
        }
        
        // その予約の情報を取得
        const otherReservation = await kv.get<Reservation>(`reservation:${resId}`);
        if (otherReservation) {
          const otherEndTime = new Date(otherReservation.reservationTime);
          otherEndTime.setMinutes(otherEndTime.getMinutes() + 2);
          
          // まだ終了していない予約のみカウント
          if (otherEndTime > now) {
            queuePosition++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      queuePosition,
      isExpired,
      currentTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to get queue position:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get queue position" },
      { status: 500 }
    );
  }
}