"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { DateField } from "@/components/date-field";
import { formatTicketNumber, parseTicketNumber, type TicketDTO } from "@/lib/tickets";

type EditTicketDialogProps = {
  ticket: TicketDTO;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (ticket: TicketDTO, fields: EditFields) => void;
};

export type EditFields = {
  number: string;
  date: string;
  driverName: string;
  plateNumber: string;
  type: string;
  origin: string;
  destination: string;
  amountBirr: string;
};

export function EditTicketDialog({ ticket, busy, error, onClose, onSave }: EditTicketDialogProps) {
  const [form, setForm] = useState<EditFields>({
    number: ticket.numberLabel,
    date: ticket.date,
    driverName: ticket.driverName,
    plateNumber: ticket.plateNumber,
    type: ticket.type,
    origin: ticket.origin,
    destination: ticket.destination,
    amountBirr: ticket.amountBirr,
  });
  const [numberTaken, setNumberTaken] = useState(false);
  const [numberChecking, setNumberChecking] = useState(false);
  const checkSeq = useRef(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  useEffect(() => {
    const parsed = parseTicketNumber(form.number);
    setNumberTaken(false);
    if (parsed === undefined || parsed === ticket.number) {
      setNumberChecking(false);
      return;
    }

    const seq = ++checkSeq.current;
    const handle = window.setTimeout(() => {
      setNumberChecking(true);
      fetch(`/api/tickets/available?number=${parsed}`)
        .then((res) => res.json() as Promise<{ taken?: boolean }>)
        .then((data) => {
          if (seq !== checkSeq.current) return;
          setNumberTaken(Boolean(data.taken));
        })
        .catch(() => {
          if (seq !== checkSeq.current) return;
          setNumberTaken(false);
        })
        .finally(() => {
          if (seq !== checkSeq.current) return;
          setNumberChecking(false);
        });
    }, 2000);

    return () => {
      window.clearTimeout(handle);
      checkSeq.current += 1;
    };
  }, [form.number, ticket.number]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (numberTaken || numberChecking) return;
    onSave(ticket, form);
  }

  return (
    <div className="edit-overlay no-print" role="presentation" onClick={() => !busy && onClose()}>
      <div
        className="edit-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-ticket-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="edit-panel-bar">
          <h2 id="edit-ticket-title">Edit ticket {ticket.numberLabel}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Close
          </button>
        </div>
        <form className="issue-form edit-form" onSubmit={submit}>
          <label>
            No.
            <input
              required
              inputMode="numeric"
              pattern="\d+"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              onBlur={() => {
                const parsed = form.number.replace(/\D/g, "");
                if (!parsed) return;
                const n = Number(parsed);
                if (Number.isInteger(n) && n >= 1) {
                  setForm((current) => ({ ...current, number: formatTicketNumber(n) }));
                }
              }}
            />
            {numberChecking ? (
              <span className="field-hint">Checking number…</span>
            ) : numberTaken ? (
              <span className="field-hint field-hint-error" role="alert">
                This number is already used.
              </span>
            ) : null}
          </label>
          <label>
            ቀን / Date
            <DateField value={form.date} onChange={(date) => setForm({ ...form, date })} />
          </label>
          <label>
            የሾፌሩ ስም / Driver
            <input
              required
              value={form.driverName}
              onChange={(e) => setForm({ ...form, driverName: e.target.value })}
            />
          </label>
          <label>
            ሰሌዳ / Plate
            <input
              required
              value={form.plateNumber}
              onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
            />
          </label>
          <label>
            አይነት / Type
            <input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </label>
          <label>
            መነሻ / From
            <input required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          </label>
          <label>
            መድረሻ / To
            <input
              required
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            />
          </label>
          <label>
            የብር መጠን / Amount
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amountBirr}
              onChange={(e) => setForm({ ...form, amountBirr: e.target.value })}
            />
          </label>
          <button
            className="btn btn-generate"
            type="submit"
            disabled={busy || numberTaken || numberChecking}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
        {error ? (
          <p className="banner" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
