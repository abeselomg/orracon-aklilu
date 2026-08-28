"use client";

import type { TicketDTO } from "@/lib/tickets";
import { CraneWatermark } from "@/components/crane-watermark";
import { OrraconLogo } from "@/components/orracon-logo";
import { TradingStamp } from "@/components/trading-stamp";

type ReceiptCardProps = {
  ticket: TicketDTO;
  confirmId: string | null;
  busy: boolean;
  onAskClaim: (id: string) => void;
  onCancelClaim: () => void;
  onConfirmClaim: (number: number) => void;
  onPrint: (id: string) => void;
  printing: boolean;
};

export function ReceiptCard({
  ticket,
  confirmId,
  busy,
  onAskClaim,
  onCancelClaim,
  onConfirmClaim,
  onPrint,
  printing,
}: ReceiptCardProps) {
  const claimed = ticket.status === "claimed";
  const asking = confirmId === ticket.id;

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
          <b className="signature">{claimed ? "Claimed — paid" : "Unclaimed"}</b>
        </p>
      </div>

      {claimed ? <TradingStamp /> : null}

      <p className="receipt-footer">ይህ ደረሰኝ ያለ ፊርማና ማህተም አያገለግልም</p>

      <div className="receipt-actions no-print">
        {claimed ? (
          <span className="paid-pill">Paid</span>
        ) : asking ? (
          <>
            <span className="confirm-copy">Mark this ticket as paid?</span>
            <button
              type="button"
              className="btn btn-claim"
              disabled={busy}
              onClick={() => onConfirmClaim(ticket.number)}
            >
              Yes, claim
            </button>
            <button type="button" className="btn btn-ghost" onClick={onCancelClaim}>
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-claim"
            disabled={busy}
            onClick={() => onAskClaim(ticket.id)}
          >
            Claim
          </button>
        )}
        <button type="button" className="btn btn-print" onClick={() => onPrint(ticket.id)}>
          Print
        </button>
      </div>
    </article>
  );
}
