"use client";

import { CircleSlashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CancelDialog } from "./cancel-dialog";

interface Reservation {
  id: string;
  createdAt: string;
  reservationTime: string;
}

interface ReservationStatusProps {
  reservation: Reservation;
  queuePosition?: number;
}

export function ReservationStatus({
  reservation,
  queuePosition = 0,
}: ReservationStatusProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}時${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}分`;
  };

  return (
    <div className="mb-5 mt-12 space-y-6 bg-white shadow-md border-slate-100 border p-6 rounded-xl">
      <div className="font-bold text-lg text-center text-green-600">
        予約済み
      </div>
      <div className="space-y-4">
        {queuePosition > 0 ? (
          <div className="text-lg text-center font-bold">
            あなたの前に
            <span className="text-red-500 text-2xl">{queuePosition}</span>
            人並んでいます
          </div>
        ) : (
          <div className="text-lg text-center font-bold">
            時間になりました。あなたの番です！
          </div>
        )}
        <div className="text-sm text-gray-600">
          <div className="font-semibold">予約番号</div>
          <div className="text-lg font-mono">{reservation.id}</div>
        </div>
        <div className="text-sm text-gray-600">
          <div className="font-semibold">予約時間</div>
          <div className="text-lg">
            {formatTime(reservation.reservationTime)}
          </div>
        </div>
      </div>
      <div className="border-t pt-4">
        <CancelDialog>
          <Button variant="outline" className="w-full" size="lg">
            <CircleSlashIcon />
            予約をキャンセルする
          </Button>
        </CancelDialog>
      </div>
    </div>
  );
}
