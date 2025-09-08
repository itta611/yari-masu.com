"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, RefreshCw, Trash2 } from "lucide-react";

interface Reservation {
  id: string;
  createdAt: string;
  reservationTime: string;
}

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reservations");
      const data = await response.json();
      if (data.success) {
        setReservations(data.reservations);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
    // 30秒ごとに更新
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNextTurn = async () => {
    if (reservations.length === 0) return;
    
    setUpdating(true);
    try {
      const response = await fetch("/api/admin/next-turn", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        // リストを更新
        await fetchReservations();
      } else {
        alert("エラーが発生しました: " + data.error);
      }
    } catch (error) {
      console.error("Failed to move to next turn:", error);
      alert("エラーが発生しました");
    }
    setUpdating(false);
  };

  const handleClearAll = async () => {
    if (!confirm("全ての予約データを削除しますか？この操作は取り消せません。")) {
      return;
    }
    
    setUpdating(true);
    try {
      const response = await fetch("/api/admin/clear-all", {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`${data.deletedCount}件の予約を削除しました`);
        // リストを更新
        await fetchReservations();
      } else {
        alert("エラーが発生しました: " + data.error);
      }
    } catch (error) {
      console.error("Failed to clear all reservations:", error);
      alert("エラーが発生しました");
    }
    setUpdating(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${formatTime(dateString)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">管理者ページ</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleClearAll}
                variant="destructive"
                size="sm"
                disabled={updating || reservations.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                全削除
              </Button>
              <Button
                onClick={fetchReservations}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                更新
              </Button>
            </div>
          </div>

          {loading && reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              現在予約はありません
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">現在のターン</h2>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600">予約番号</div>
                    <div className="font-mono text-lg">{reservations[0].id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">予想開始時刻</div>
                    <div className="text-lg">
                      {formatTime(reservations[0].reservationTime)}
                    </div>
                  </div>
                  <Button
                    onClick={handleNextTurn}
                    disabled={updating}
                    size="lg"
                    className="ml-4"
                  >
                    <ChevronRightIcon className="mr-2" />
                    次のターンへ
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">待機中の予約</h2>
                <div className="space-y-2">
                  {reservations.slice(1).map((reservation, index) => (
                    <div
                      key={reservation.id}
                      className="p-3 border rounded-lg flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          #{index + 2}
                        </div>
                        <div>
                          <div className="font-mono">{reservation.id}</div>
                          <div className="text-sm text-gray-500">
                            予約時刻: {formatDateTime(reservation.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">予想開始時刻</div>
                        <div className="font-semibold">
                          {formatTime(reservation.reservationTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <div className="text-sm text-gray-600">
                  総待機数: <span className="font-bold">{reservations.length}</span> 件
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}