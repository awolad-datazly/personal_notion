"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SUPPORT_CONFIG } from "@/config/support";

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const amount = SUPPORT_CONFIG.amountBdt;
  const phone = SUPPORT_CONFIG.phoneNumber;

  useEffect(() => {
    if (!open || SUPPORT_CONFIG.qrImageUrl) {
      return;
    }

    let cancelled = false;

    void QRCode.toDataURL(phone, {
      margin: 1,
      width: 240,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    }).then((url) => {
      if (!cancelled) {
        setQrDataUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, phone]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed right-6 bottom-6 z-40 flex h-10 items-center gap-2.5 rounded-md border border-pink-500/40 bg-zinc-900/95 px-4 text-sm font-medium text-zinc-100 shadow-xl backdrop-blur-md transition-all hover:border-pink-500/70 hover:text-white"
        >
          <span className="size-2 rounded-full bg-pink-500 animate-pulse" />
          <span>Support {amount}৳</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Fuel the Dev Engine</span>
            <span className="text-amber-400">☕</span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-zinc-300">
            {amount}৳ = 1 cup of Tong-er Cha to keep this server alive and bug-free. Scan with bKash or copy the personal number below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border border-border bg-white p-3">
            {SUPPORT_CONFIG.qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={SUPPORT_CONFIG.qrImageUrl}
                alt="bKash QR code"
                width={240}
                height={240}
                className="size-60"
              />
            ) : qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`bKash QR for ${phone}`}
                width={240}
                height={240}
                className="size-60"
              />
            ) : (
              <div className="flex size-60 items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                Preparing QR…
              </div>
            )}
          </div>

          <div className="w-full space-y-2">
            <p className="text-center text-xs text-caption">bKash personal</p>
            <button
              type="button"
              onClick={copyNumber}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="font-mono text-sm tracking-tight text-foreground">
                {phone}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-bkash">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
