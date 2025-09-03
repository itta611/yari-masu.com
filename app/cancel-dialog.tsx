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

export const CancelDialog: FC<Props> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    
    // cookieから予約IDを取得
    const cookies = document.cookie.split(";");
    let reservationId = null;
    
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === "reservationId") {
        reservationId = value;
        break;
      }
    }
    
    if (reservationId) {
      try {
        const response = await fetch(`/api/reservations?id=${reservationId}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          // ページをリロードして状態を更新
          window.location.reload();
        } else {
          alert("キャンセルに失敗しました。もう一度お試しください。");
          setIsCancelling(false);
          setOpen(false);
        }
      } catch (error) {
        console.error("Failed to cancel reservation:", error);
        alert("キャンセルに失敗しました。もう一度お試しください。");
        setIsCancelling(false);
        setOpen(false);
      }
    } else {
      // cookieがない場合もリロード
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogTitle className="text-center">予約のキャンセル</DialogTitle>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            予約を取り消します。本当にキャンセルしますか？
          </div>
        </div>
        <DialogFooter className="!flex-col">
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setOpen(false)}
          >
            いいえ
          </Button>
          <Button
            className="w-full"
            size="lg"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? "キャンセル中..." : "はい、ヤメーマス"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
