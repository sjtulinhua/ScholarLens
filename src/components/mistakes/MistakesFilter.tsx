"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function MistakesFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSubject = searchParams.get("subject") || "all";
  const currentStatus = searchParams.get("status") || "all";

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/mistakes?${params.toString()}`);
  };

  const hasFilter = currentSubject !== "all" || currentStatus !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`rounded-full ${hasFilter ? "bg-blue-50 text-blue-600 border-blue-200" : ""}`}>
          <Filter className="mr-2 h-4 w-4" /> 
          {hasFilter ? "筛选中..." : "筛选对比"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white">
        <DropdownMenuLabel>过滤错题</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-zinc-900 cursor-pointer hover:bg-zinc-100 data-[state=open]:bg-zinc-100">
            <span className="font-medium">科目 ({currentSubject === "all" ? "全部" : currentSubject})</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white border-zinc-200 shadow-xl z-[100]">
            <DropdownMenuRadioGroup value={currentSubject} onValueChange={(v) => handleFilter("subject", v)}>
              <DropdownMenuRadioItem value="all" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">全部科目</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="math" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">数学</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="physics" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">物理</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="chemistry" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">化学</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-zinc-900 cursor-pointer hover:bg-zinc-100 data-[state=open]:bg-zinc-100">
            <span className="font-medium">状态 ({currentStatus === "all" ? "全部" : currentStatus})</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white border-zinc-200 shadow-xl z-[100]">
            <DropdownMenuRadioGroup value={currentStatus} onValueChange={(v) => handleFilter("status", v)}>
              <DropdownMenuRadioItem value="all" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">全部状态</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">待解决 (Active)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="corrected" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">已订正 (Corrected)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="archived" className="cursor-pointer text-zinc-900 focus:bg-zinc-100 data-[state=checked]:bg-zinc-50 data-[state=checked]:font-medium">已归档 (Archived)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {hasFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 justify-center font-medium"
              onClick={() => router.push("/mistakes")}
            >
              清除筛选
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
