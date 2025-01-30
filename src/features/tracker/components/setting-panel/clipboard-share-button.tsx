"use client";

import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { Send, ExternalLink } from "lucide-react";

interface ClipboardShareButtonProps {
  shareLink: string;
}

export function ClipboardShareButton({ shareLink }: ClipboardShareButtonProps) {
  // const { toast } = useToast();

  return (
    <div className="flex gap-2">
      {/* Copy to Clipboard Button */}
      <CopyToClipboard
        text={shareLink}
        onCopy={() => toast.success("링크가 복사되었습니다.")}
      >
        <Button variant="outline" size="sm">
          <Send className="w-4 h-4 mr-2" />
          공유용 링크 복사
        </Button>
      </CopyToClipboard>

      {/* Open Link in New Tab Button */}
      {/* <Button
        variant="outline"
        size="sm"
        onClick={() => toast.success("링크가 새 탭에서 열렸습니다.")}
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        링크 열기
      </Button> */}
    </div>
  );
}
