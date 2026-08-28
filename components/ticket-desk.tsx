"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ReceiptCard } from "@/components/receipt-card";
import { todayInAddis, type TicketDTO, type TicketStatus } from "@/lib/tickets";

type Filter = "all" | TicketStatus;

const emptyForm = {
  date: "",
  driverName: "",
  plateNumber: "",
  type: "",
  origin: "",
  destination: "",
  amountBirr: "",
};

export function TicketDesk() {
  const [form, setForm] = useState(emptyForm);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [counts, setCounts] = useState({ total: 0, unclaimed: 0, claimed: 0 });
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);

  const load = useCallback(async (status: Filter, q: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/tickets?${params.toString()}`);
    if (!res.ok) throw new Error("Could not load tickets.");
    const data = (await res.json()) as {
      tickets: TicketDTO[];
      counts: { total: number; unclaimed: number; claimed: number };
    };
    setTickets(data.tickets);
    setCounts(data.counts);
  }, []);

  useEffect(() => {
    setForm((current) => (current.date ? current : { ...current, date: todayInAddis() }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    load(filter, query).catch((err: Error) => {
      if (!cancelled) setError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [filter, query, load]);

  useEffect(() => {
    const afterPrint = () => setPrintId(null);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Could not generate ticket.");
      setForm({ ...emptyForm, date: todayInAddis() });
      setFilter("unclaimed");
      setQuery("");
      await load("unclaimed", "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate ticket.");
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmClaim(number: number) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets/${number}/claim`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Could not claim ticket.");
      setConfirmId(null);
      setFilter("claimed");
      await load("claimed", query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim ticket.");
    } finally {
      setBusy(false);
    }
  }

  function printTicket(id: string) {
    setPrintId(id);
    requestAnimationFrame(() => window.print());
  }

  function printVisible() {
    setPrintId(null);
    requestAnimationFrame(() => window.print());
  }

  return (
    <div className={`desk ${printId ? "printing-one" : ""}`} data-print-id={printId ?? ""}>
      <header className="mast no-print">
        <div>
          <p className="eyebrow">Orracon Construction Plc</p>
          <h1>የገንዘብ መቀበያ ደረሰኝ</h1>
          <p className="lede">Issue a cash receipt, print the stub, then claim it when the driver is paid.</p>
        </div>
        <dl className="counts">
          <div>
            <dt>On this board</dt>
            <dd>{counts.total}</dd>
          </div>
          <div>
            <dt>Unclaimed</dt>
            <dd>{counts.unclaimed}</dd>
          </div>
          <div>
            <dt>Paid</dt>
            <dd>{counts.claimed}</dd>
          </div>
        </dl>
      </header>

      <form className="issue-form no-print" onSubmit={onGenerate}>
        <label>
          ቀን / Date
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
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
          <input
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        </label>
        <label>
          መነሻ / From
          <input
            required
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
          />
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
        <button className="btn btn-generate" type="submit" disabled={busy}>
          Generate
        </button>
      </form>

      {error ? (
        <p className="banner no-print" role="alert">
          {error}
        </p>
      ) : null}

      <div className="toolbar no-print">
        <div className="chips" role="tablist" aria-label="Ticket status">
          {(["all", "unclaimed", "claimed"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? "chip active" : "chip"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : value === "unclaimed" ? "Unclaimed" : "Claimed"}
            </button>
          ))}
        </div>
        <input
          className="search"
          placeholder="Search number, driver, or plate"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="btn btn-ghost" onClick={printVisible} disabled={tickets.length === 0}>
          Print visible
        </button>
      </div>

      {tickets.length === 0 ? (
        <p className="empty no-print">No tickets yet. Fill the form and generate the first receipt.</p>
      ) : (
        <section className="ticket-grid">
          {tickets.map((ticket) => (
            <ReceiptCard
              key={ticket.id}
              ticket={ticket}
              confirmId={confirmId}
              busy={busy}
              printing={printId === ticket.id}
              onAskClaim={setConfirmId}
              onCancelClaim={() => setConfirmId(null)}
              onConfirmClaim={onConfirmClaim}
              onPrint={printTicket}
            />
          ))}
        </section>
      )}
    </div>
  );
}
