import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function QuestionMarkTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        {/* TooltipTrigger로 아이콘 감싸기 */}
        <TooltipTrigger asChild>
          <HelpCircle className="w-4 h-4 text-gray-500 cursor-pointer" />
        </TooltipTrigger>
        <TooltipContent side="right" className="w-40 break-keep">
          {/* 툴팁에 원하는 내용 표시 */}
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
