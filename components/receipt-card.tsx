"use client";

import { Pencil } from "lucide-react";
import type { TicketDTO } from "@/lib/tickets";
import { CraneWatermark } from "@/components/crane-watermark";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { OrraconLogo } from "@/components/orracon-logo";
import { TradingStamp } from "@/components/trading-stamp";

type ReceiptCardProps = {
  ticket: TicketDTO;
  busy: boolean;
  onConfirmClaim: (number: number) => void;
  onPrint: (id: string) => void;
  onEdit: () => void;
  printing: boolean;
};

export function ReceiptCard({
  ticket,
  busy,
  onConfirmClaim,
  onPrint,
  onEdit,
  printing,
}: ReceiptCardProps) {
  const claimed = ticket.status === "claimed";

  return (
    <article
      className={`receipt${printing ? " is-printing" : ""}`}
      data-ticket-id={ticket.id}
      data-status={ticket.status}
    >
      <CraneWatermark />
      <header className="receipt-head">
        <OrraconLogo className="receipt-logo" />
        <div className="receipt-brand">
          <p className="receipt-amharic-name">ኦራኮን ኮንስትራክሽን ኃ/የተ/የግ/ማ</p>
          <p className="receipt-english-name">Orracon Construction Plc</p>
          <p className="receipt-phones">0911259696, 0905155057</p>
        </div>
        <div className="receipt-ids">
          <p>
            <span>ቀን / Date</span>
            <strong>{ticket.date}</strong>
          </p>
          <p>
            <span>No.</span>
            <strong className="receipt-no">{ticket.numberLabel}</strong>
          </p>
        </div>
      </header>

      <h2 className="receipt-title">የገንዘብ መቀበያ ደረሰኝ</h2>
      <p className="receipt-title-en">Cash Receipt</p>

      <div className="receipt-fields">
        <p className="field field-split">
          <span>
            የሾፌሩ ስም / Driver <b>{ticket.driverName}</b>
          </span>
          <span>
            ሰሌዳ / Plate <b>{ticket.plateNumber}</b>
          </span>
        </p>
        <p className="field">
          አይነት / Type <b>{ticket.type}</b>
        </p>
        <p className="field field-split">
          <span>
            መነሻ / From <b>{ticket.origin}</b>
          </span>
          <span>
            መድረሻ / To <b>{ticket.destination}</b>
          </span>
        </p>
        <p className="field">
          የብር መጠን / Amount <b>{ticket.amountBirr} ብር</b>
        </p>
        <p className="field">
          የአስሪው ፊርማ / Issuer{" "}
          <b className="signature">{claimed ? "Paid" : "Unpaid"}</b>
        </p>
      </div>

      {claimed ? <TradingStamp /> : null}

      <p className="receipt-footer">ይህ ደረሰኝ ያለ ፊርማና ማህተም አያገለግልም</p>

      <div className="receipt-actions no-print">
        {claimed ? (
          <span className="paid-pill">Paid</span>
        ) : (
          <MarkPaidButton ticketNumber={ticket.number} busy={busy} onConfirm={onConfirmClaim} />
        )}
        <button type="button" className="btn btn-print" onClick={() => onPrint(ticket.id)}>
          Print
        </button>
        <button type="button" className="btn btn-print btn-icon" aria-label="Edit" onClick={onEdit}>
          <Pencil size={16} />
        </button>
      </div>
    </article>
  );
}
