"use client";

import { CircleSlashIcon, ClockIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CancelDialog } from "./cancel-dialog";
import { useToast } from "@/components/hooks/use-toast";

interface Reservation {
  id: string;
  createdAt: string;
  reservationTime: string;
}

export default function Home() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [justReserved, setJustReserved] = useState(false);
  const [currentWaitTime, setCurrentWaitTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const checkReservation = async () => {
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
          const response = await fetch(`/api/reservations?id=${reservationId}`);
          const data = await response.json();

          if (data.success && data.reservation) {
            if (data.isExpired) {
              // 予約が期限切れの場合、cookieを削除
              document.cookie =
                "reservationId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              setReservation(null);
            } else {
              setReservation(data.reservation);
              // URLパラメータをチェックして新規予約かどうか確認
              const urlParams = new URLSearchParams(window.location.search);
              if (urlParams.get("reserved") === "true") {
                setJustReserved(true);
                // URLからパラメータを削除
                window.history.replaceState({}, "", window.location.pathname);
              }
            }
          } else {
            // 予約が見つからない場合、cookieを削除
            document.cookie =
              "reservationId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setReservation(null);
          }
        } catch (error) {
          console.error("Failed to fetch reservation:", error);
          document.cookie =
            "reservationId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          setReservation(null);
        }
      }
      setIsLoading(false);
    };

    checkReservation();
  }, []);

  // 待ち時間を取得
  useEffect(() => {
    const fetchWaitTime = async () => {
      try {
        const response = await fetch("/api/wait-time");
        const data = await response.json();
        if (data.success) {
          setCurrentWaitTime(data.waitTimeMinutes);
        }
      } catch (error) {
        console.error("Failed to fetch wait time:", error);
      }
    };

    fetchWaitTime();
    // 30秒ごとに待ち時間を更新
    const interval = setInterval(fetchWaitTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}時${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}分`;
  };

  const handleReservation = async () => {
    setIsReserving(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // ページをリロードして予約状態を反映
        window.location.href = "/?reserved=true";
      } else {
        alert("予約に失敗しました。もう一度お試しください。");
        setIsReserving(false);
      }
    } catch (error) {
      console.error("Failed to create reservation:", error);
      alert("予約に失敗しました。もう一度お試しください。");
      setIsReserving(false);
    }
  };

  useEffect(() => {
    if (justReserved && reservation) {
      toast({
        title: "予約完了",
        description: `ヤリーマした！予約完了。`,
      });
      setJustReserved(false);
    }
  }, [justReserved, reservation, toast]);

  if (isLoading) {
    return (
      <div className="max-w-[400px] mx-auto">
        <div className="border-b py-4 text-center">
          <div className="text-2xl font-bold">2-1 文化祭</div>
          <div className="text-xl mt-2 text-slate-500">
            ヤリーマス予約サイト
          </div>
        </div>
        <div className="px-6 mt-12">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-[400px] mx-auto h-screen",
        reservation && "bg-slate-100"
      )}
    >
      <div className="border-b py-4 text-center bg-white">
        <div className="text-2xl font-bold">2-1 文化祭</div>
        <div className="text-xl mt-2 text-slate-500">ヤリーマス予約サイト</div>
      </div>
      <div className="px-6">
        {reservation ? (
          <div className="mb-5 mt-12 space-y-6 bg-white shadow-md border-slate-100 border p-6 rounded-xl">
            <div className="font-bold text-lg text-center text-green-600">
              予約済み
            </div>
            <div className="space-y-4">
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
        ) : (
          <>
            <div className="mb-5 mt-12 space-y-8 bg-white shadow-md border-slate-100 border p-4 rounded-xl">
              <div className="font-bold flex items-center gap-2">
                <ClockIcon className="size-4" />
                現在の待ち時間
              </div>
              <div className="text-center text-2xl">
                <span className="text-red-500 text-6xl font-bold">{currentWaitTime}</span>分
              </div>
              <div className="text-xs text-gray-500 text-right">
                {new Date().getHours()}時{new Date().getMinutes()}分時点
              </div>
            </div>
            <Button
              className="w-full mt-2"
              size="lg"
              onClick={handleReservation}
              disabled={isReserving}
            >
              <UsersIcon />
              {isReserving ? "予約中..." : "予約する"}
            </Button>
          </>
        )}
      </div>
      <div className="absolute right-3 left-3 bottom-3 text-right text-slate-400 m-auto">
        <a
          href="https://github.com/itta611/yari-masu.com"
          target="_blank"
          rel="noreferrer"
        >
          Contribute
        </a>
      </div>
    </div>
  );
}
