import { ClockIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="max-w-[400px] mx-auto">
      <div className="border-b py-4 text-center">
        <div className="text-2xl font-bold">2-1 文化祭</div>
        <div className="text-xl mt-2 text-slate-500">ヤリーマス予約サイト</div>
      </div>
      <div className="px-6">
        <div className="mb-5 mt-12 space-y-8 bg-white shadow-md border-slate-100 border p-4 rounded-xl">
          <div className="font-bold flex items-center gap-2">
            <ClockIcon className="size-4" />
            現在の待ち時間
          </div>
          <div className="text-red-500 text-center text-5xl font-bold">2分</div>
          <div className="text-xs text-gray-500 text-right">
            {new Date().getHours()}時{new Date().getMinutes()}分時点
          </div>
        </div>
        <Button className="w-full mt-4" size="lg">
          <UsersIcon />
          予約する
        </Button>
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
