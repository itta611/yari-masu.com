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
            onClick={() => {
              // cookieを削除してページをリロード
              document.cookie =
                "reservationId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              window.location.reload();
            }}
          >
            はい、ヤメーマス
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
