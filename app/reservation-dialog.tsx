"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  children?: ReactNode;
}

export const ReservationDialog: FC<Props> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const handleReservation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          waitingPeople: 20,
          estimatedTime: "2:00",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReservationId(data.reservationId);
        alert(`予約が完了しました！\n予約ID: ${data.reservationId}`);
        setOpen(false);
      } else {
        alert("予約に失敗しました。もう一度お試しください。");
      }
    } catch (error) {
      console.error("Reservation error:", error);
      alert("予約に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogTitle className="text-center">予約確認</DialogTitle>
        <span className="text-slate-500">
          現在<span className="font-bold">20人</span>
          が並んでいます。予想時刻は<span className="font-bold">2:00</span>
          です。予約しますか？
        </span>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            キャンセル
          </Button>
          <Button onClick={handleReservation} disabled={isLoading}>
            {isLoading ? "予約中..." : "予約する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
