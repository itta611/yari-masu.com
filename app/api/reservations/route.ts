import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

interface Reservation {
  id: string;
  reservationTime: string;
  waitingPeople: number;
  estimatedTime: string;
  createdAt: string;
}

function generateReservationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`.toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { waitingPeople, estimatedTime } = body;

    const reservationId = generateReservationId();
    const now = new Date().toISOString();

    const reservation: Reservation = {
      id: reservationId,
      reservationTime: now,
      waitingPeople,
      estimatedTime,
      createdAt: now,
    };

    // Vercel KVに予約データを保存
    await kv.set(`reservation:${reservationId}`, reservation);
    
    // 予約リストにIDを追加（時系列順）
    await kv.zadd("reservations", {
      score: Date.now(),
      member: reservationId,
    });

    return NextResponse.json({
      success: true,
      reservationId,
      reservation,
    });
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 最新の予約を取得（最大100件）
    const reservationIds = await kv.zrange("reservations", 0, 99, {
      rev: true,
    });

    const reservations = await Promise.all(
      reservationIds.map(async (id) => {
        return await kv.get(`reservation:${id}`);
      })
    );

    return NextResponse.json({
      success: true,
      reservations: reservations.filter(Boolean),
    });
  } catch (error) {
    console.error("Failed to fetch reservations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}