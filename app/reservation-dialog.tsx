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
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button>予約する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
