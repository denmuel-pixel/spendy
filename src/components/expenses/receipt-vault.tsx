"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageIcon, X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptVaultProps {
  imageUrl: string;
  merchant?: string | null;
  amount?: number;
}

export default function ReceiptVault({ imageUrl, merchant, amount }: ReceiptVaultProps) {
  return (
    <Dialog>
      <DialogTrigger>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors cursor-pointer">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Struk</span>
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            {merchant || "Foto Struk"}
            {amount && (
              <span className="text-muted-foreground font-normal">
                · Rp {amount.toLocaleString("id-ID")}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="relative bg-muted rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={`Receipt${merchant ? ` from ${merchant}` : ""}`}
            className="w-full h-auto max-h-[70vh] object-contain"
            loading="lazy"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(imageUrl, "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka di Tab Baru
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const a = document.createElement("a");
              a.href = imageUrl;
              a.download = `receipt-${merchant || "struk"}.jpg`;
              a.click();
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
