"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type MarkPaidButtonProps = {
  ticketNumber: number;
  busy: boolean;
  onConfirm: (number: number) => void;
};

export function MarkPaidButton({ ticketNumber, busy, onConfirm }: MarkPaidButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="btn btn-claim" disabled={busy}>
          Mark paid
        </button>
      </PopoverTrigger>
      <PopoverContent className="claim-pop" align="start" sideOffset={8}>
        <p>Mark this ticket as paid?</p>
        <div className="claim-pop-actions">
          <button
            type="button"
            className="btn btn-claim"
            disabled={busy}
            onClick={() => {
              onConfirm(ticketNumber);
              setOpen(false);
            }}
          >
            Yes, mark paid
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
