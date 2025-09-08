import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

interface Reservation {
  id: string;
  createdAt: string;
  reservationTime: string;
}

function generateReservationId(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${randomPart}`.toUpperCase();
}

export async function POST() {
  try {
    const reservationId = generateReservationId();
    const now = new Date();
    const nowIso = now.toISOString();

    // 最新の予約を取得
    const latestReservationIds = await kv.zrange("reservations", 0, 0, {
      rev: true,
    });

    let reservationTime: Date;

    if (latestReservationIds.length > 0) {
      // 最新の予約を取得
      const latestReservation = await kv.get<Reservation>(
        `reservation:${latestReservationIds[0]}`
      );

      if (latestReservation && latestReservation.reservationTime) {
        // 最新の予約の終了時間（reservationTime + 1分）
        const latestEndTime = new Date(latestReservation.reservationTime);
        latestEndTime.setMinutes(latestEndTime.getMinutes() + 1);

        if (latestEndTime > now) {
          // 最新の予約がまだ終了していない場合、その終了時間を新しい予約時間とする
          reservationTime = latestEndTime;
        } else {
          // 最新の予約が既に終了している場合、現在時刻を使用
          reservationTime = now;
        }
      } else {
        // reservationTimeがない場合は現在時刻を使用
        reservationTime = now;
      }
    } else {
      // 予約が空の場合、現在時刻を使用
      reservationTime = now;
    }

    const reservation: Reservation = {
      id: reservationId,
      createdAt: nowIso,
      reservationTime: reservationTime.toISOString(),
    };

    // Vercel KVに予約データを保存
    await kv.set(`reservation:${reservationId}`, reservation);

    // 予約リストにIDを追加（時系列順）
    await kv.zadd("reservations", {
      score: Date.now(),
      member: reservationId,
    });

    const response = NextResponse.json({
      success: true,
      reservationId,
      reservation,
    });

    // 予約IDをcookieに保存
    response.cookies.set("reservationId", reservationId, {
      httpOnly: false, // JavaScriptからアクセス可能にする
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24時間
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    // キャンセルする予約を取得
    const cancelledReservation = await kv.get<Reservation>(`reservation:${id}`);
    
    if (!cancelledReservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // キャンセルする予約の時間
    const cancelledTime = new Date(cancelledReservation.reservationTime);
    
    // 全ての予約IDを時系列順で取得
    const allReservationIds = await kv.zrange("reservations", 0, -1);
    
    // キャンセルする予約より後の予約を特定
    let foundCancelled = false;
    const reservationsToUpdate: { id: string; reservation: Reservation }[] = [];
    
    for (const resId of allReservationIds) {
      if (resId === id) {
        foundCancelled = true;
        continue;
      }
      
      if (foundCancelled) {
        const reservation = await kv.get<Reservation>(`reservation:${resId}`);
        if (reservation) {
          const resTime = new Date(reservation.reservationTime);
          // キャンセルした予約より後の時間の予約のみ更新
          if (resTime > cancelledTime) {
            reservationsToUpdate.push({ id: resId as string, reservation });
          }
        }
      }
    }
    
    // 後続の予約を1分前にずらす
    for (const { id: resId, reservation } of reservationsToUpdate) {
      const newTime = new Date(reservation.reservationTime);
      newTime.setMinutes(newTime.getMinutes() - 1);
      
      const updatedReservation: Reservation = {
        ...reservation,
        reservationTime: newTime.toISOString(),
      };
      
      await kv.set(`reservation:${resId}`, updatedReservation);
    }
    
    // キャンセルする予約を削除
    await kv.del(`reservation:${id}`);
    await kv.zrem("reservations", id);
    
    // cookieを削除するようレスポンスに指示
    const response = NextResponse.json({
      success: true,
      message: "Reservation cancelled successfully",
    });
    
    response.cookies.set("reservationId", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // 即座に削除
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Failed to cancel reservation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // IDが指定されていない場合は全ての予約を返す（管理者ページ用）
    if (!id) {
      const allReservationIds = await kv.zrange("reservations", 0, -1);
      const reservations: Reservation[] = [];
      
      for (const resId of allReservationIds) {
        const reservation = await kv.get<Reservation>(`reservation:${resId}`);
        if (reservation) {
          reservations.push(reservation);
        }
      }
      
      return NextResponse.json({
        success: true,
        reservations,
        total: reservations.length,
      });
    }

    // 特定のIDの予約を取得
    const reservation = await kv.get<Reservation>(`reservation:${id}`);

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // 予約が期限切れかチェック（予約時間 + 1分）
    const reservationEndTime = new Date(reservation.reservationTime);
    reservationEndTime.setMinutes(reservationEndTime.getMinutes() + 1);
    const now = new Date();

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
          otherEndTime.setMinutes(otherEndTime.getMinutes() + 1);
          
          // まだ終了していない予約のみカウント
          if (otherEndTime > now) {
            queuePosition++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      reservation,
      isExpired,
      queuePosition,
    });
  } catch (error) {
    console.error("Failed to fetch reservation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reservation" },
      { status: 500 }
    );
  }
}
