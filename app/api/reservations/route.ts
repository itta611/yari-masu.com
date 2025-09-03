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
        // 最新の予約の終了時間（reservationTime + 2分）
        const latestEndTime = new Date(latestReservation.reservationTime);
        latestEndTime.setMinutes(latestEndTime.getMinutes() + 2);

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

    // 特定のIDの予約を取得
    const reservation = await kv.get<Reservation>(`reservation:${id}`);

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // 予約が期限切れかチェック（予約時間 + 2分）
    const reservationEndTime = new Date(reservation.reservationTime);
    reservationEndTime.setMinutes(reservationEndTime.getMinutes() + 2);
    const now = new Date();

    const isExpired = reservationEndTime < now;

    return NextResponse.json({
      success: true,
      reservation,
      isExpired,
    });
  } catch (error) {
    console.error("Failed to fetch reservation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reservation" },
      { status: 500 }
    );
  }
}
