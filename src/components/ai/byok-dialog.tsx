"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearGeminiKey,
  GEMINI_KEY_HEADER,
  maskGeminiKey,
  readGeminiKey,
  writeGeminiKey,
} from "@/lib/gemini-key";

export function ByokDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    function handleCustomOpen() {
      const existing = readGeminiKey();
      setSavedKey(existing);
      setValue(existing);
      setStatus(null);
      setOpen(true);
    }

    window.addEventListener("devpulse.open-byok", handleCustomOpen);
    return () => window.removeEventListener("devpulse.open-byok", handleCustomOpen);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      return;
    }

    const existing = readGeminiKey();
    setSavedKey(existing);
    setValue(existing);
    setStatus(null);
  }

  function handleSave() {
    writeGeminiKey(value);
    const next = readGeminiKey();
    setSavedKey(next);
    setValue(next);
    setStatus(next ? "Key saved in this browser only." : "Key cleared.");
  }

  function handleClear() {
    clearGeminiKey();
    setSavedKey("");
    setValue("");
    setStatus("Key removed from localStorage.");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/90 px-3.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <KeyRound className="size-4 text-zinc-400" />
          <span>Gemini Key</span>
          {savedKey ? (
            <span className="size-2 rounded-full bg-emerald-500" />
          ) : (
            <span className="size-2 rounded-full bg-zinc-600" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Bring your own Gemini key</DialogTitle>
          <DialogDescription>
            Stored in <span className="font-mono">localStorage</span> on this
            device. Requests send it as{" "}
            <span className="font-mono">{GEMINI_KEY_HEADER}</span>. Nothing is
            saved on the server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google AI Studio API key</Label>
            <Input
              id="gemini-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="AIza..."
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="font-mono"
            />
          </div>
          <p className="font-mono text-xs text-caption">
            {savedKey
              ? `Saved: ${maskGeminiKey(savedKey)}`
              : "No key saved yet."}
          </p>
          {status ? (
            <p className="text-sm text-muted-foreground">{status}</p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={!savedKey && !value}
          >
            <Trash2 />
            Clear
          </Button>
          <Button type="button" onClick={handleSave}>
            Save key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
