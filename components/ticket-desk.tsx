"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { DateField } from "@/components/date-field";
import { ReceiptCard } from "@/components/receipt-card";
import { TicketTable } from "@/components/ticket-table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseIsoDate, toIsoDate, todayInAddis, type TicketDTO, type TicketStatus } from "@/lib/tickets";

type Filter = "all" | TicketStatus;
type DatePreset = "all" | "daily" | "weekly" | "custom";

type ApiPayload = {
  error?: string;
  tickets?: TicketDTO[];
  counts?: { total: number; unclaimed: number; claimed: number };
  pagination?: { page: number; pageSize: number; matched: number; pageCount: number };
} & Partial<TicketDTO>;

async function readJson(res: Response): Promise<ApiPayload> {
  const text = await res.text();
  if (!text) return { error: res.ok ? undefined : "The server returned an empty response." };
  try {
    return JSON.parse(text) as ApiPayload;
  } catch {
    return { error: "The server did not return valid JSON." };
  }
}

const PAGE_SIZE = 10;

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
  const [latestTicket, setLatestTicket] = useState<TicketDTO | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [counts, setCounts] = useState({ total: 0, unclaimed: 0, claimed: 0 });
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, matched: 0, pageCount: 1 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const loadSeq = useRef(0);

  const load = useCallback(
    async (
      status: Filter,
      q: string,
      nextPage: number,
      date: DatePreset,
      from: string,
      to: string,
    ) => {
      const seq = ++loadSeq.current;
      setListLoading(true);
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      if (date !== "all") params.set("date", date);
      if (date === "custom") {
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }
      params.set("page", String(nextPage));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await readJson(res);
      if (seq !== loadSeq.current) return;
      if (!res.ok) throw new Error(data.error ?? "Could not load tickets.");
      setTickets(data.tickets ?? []);
      setCounts(data.counts ?? { total: 0, unclaimed: 0, claimed: 0 });
      const next = data.pagination ?? { page: nextPage, pageSize: PAGE_SIZE, matched: 0, pageCount: 1 };
      setPagination(next);
      setListLoading(false);
      if (nextPage > next.pageCount) {
        setPage(next.pageCount);
      }
    },
    [],
  );

  useEffect(() => {
    setForm((current) => (current.date ? current : { ...current, date: todayInAddis() }));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (query === debouncedQuery) return;
      setPage(1);
      setDebouncedQuery(query);
    }, 2000);
    return () => window.clearTimeout(handle);
  }, [query, debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    load(filter, debouncedQuery, page, datePreset, customFrom, customTo).catch((err: Error) => {
      if (!cancelled) {
        setError(err.message);
        setListLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filter, debouncedQuery, page, datePreset, customFrom, customTo, load]);

  useEffect(() => {
    const afterPrint = () => setPrintId(null);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  useEffect(() => {
    if (!printId || !latestTicket || latestTicket.id !== printId) return;
    const frame = requestAnimationFrame(() => window.print());
    return () => cancelAnimationFrame(frame);
  }, [printId, latestTicket]);

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Could not generate ticket.");
      setLatestTicket(payload as TicketDTO);
      setJustCreated(true);
      setPage(1);
      await load(filter, debouncedQuery, 1, datePreset, customFrom, customTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate ticket.");
    } finally {
      setGenerating(false);
    }
  }

  async function onConfirmClaim(number: number) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets/${number}/claim`, { method: "POST" });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Could not mark ticket as paid.");
      const claimed = payload as TicketDTO;
      setLatestTicket((current) => (current?.number === claimed.number ? claimed : current));
      await load(filter, debouncedQuery, page, datePreset, customFrom, customTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark ticket as paid.");
    } finally {
      setBusy(false);
    }
  }

  function printTicket(id: string) {
    const fromTable = tickets.find((ticket) => ticket.id === id);
    if (fromTable && latestTicket?.id !== id) {
      setLatestTicket(fromTable);
      setJustCreated(false);
    }
    setPrintId(id);
  }

  return (
    <div className={`desk ${printId ? "printing-one" : ""}`} data-print-id={printId ?? ""}>
      <header className="mast no-print">
        <div>
          <p className="eyebrow">Orracon Construction Plc</p>
          <h1>የገንዘብ መቀበያ ደረሰኝ</h1>
          <p className="lede">Issue a cash receipt, print the stub, then mark it paid when the driver is paid.</p>
        </div>
      </header>

      <form className="issue-form no-print" onSubmit={onGenerate}>
        <label>
          ቀን / Date
          <DateField value={form.date} onChange={(date) => setForm({ ...form, date })} />
        </label>
        <label>
          የሾፌሩ ስም / Driver
          <input
            required
            value={form.driverName}
            placeholder="Aklilu"
            onChange={(e) => setForm({ ...form, driverName: e.target.value })}
          />
        </label>
        <label>
          ሰሌዳ / Plate
          <input
            required
            value={form.plateNumber}
            placeholder="B12345"
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
          />
        </label>
        <label>
          አይነት / Type
          <input
            required
            value={form.type}
            placeholder="Sino Track"
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        </label>
        <label>
          መነሻ / From
          <input
            required
            value={form.origin}
            placeholder="22 mazoria"
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
          />
        </label>
        <label>
          መድረሻ / To
          <input
            required
            value={form.destination}
            placeholder="Bulbula"
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
            placeholder="6000"
            onChange={(e) => setForm({ ...form, amountBirr: e.target.value })}
          />
        </label>
        <button className="btn btn-generate" type="submit" disabled={generating || busy} aria-busy={generating}>
          {generating ? "Generating…" : "Generate"}
        </button>
      </form>

      {error ? (
        <p className="banner no-print" role="alert">
          {error}
        </p>
      ) : null}

      {latestTicket ? (
        <section className="latest-ticket" aria-label="Newly created ticket">
          <div className="latest-ticket-bar no-print">
            {justCreated ? (
              <p className="success-banner" role="status">
                Successfully created.
              </p>
            ) : (
              <p className="section-label">Ticket preview</p>
            )}
            <button
              type="button"
              className="btn btn-ghost latest-ticket-close"
              onClick={() => {
                setLatestTicket(null);
                setJustCreated(false);
              }}
            >
              Close
            </button>
          </div>
          <ReceiptCard
            ticket={latestTicket}
            busy={busy}
            printing={printId === latestTicket.id}
            onConfirmClaim={onConfirmClaim}
            onPrint={printTicket}
          />
        </section>
      ) : null}

      <div className="toolbar no-print">
        <p className="section-label">Report</p>
        <div className="toolbar-row">
          <div className="chips" role="tablist" aria-label="Ticket status">
            {(["all", "unclaimed", "claimed"] as Filter[]).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={filter === value ? "chip active" : "chip"}
                onClick={() => {
                  setPage(1);
                  setFilter(value);
                }}
              >
                {value === "all" ? "All" : value === "unclaimed" ? "Unpaid" : "Paid"}
              </button>
            ))}
          </div>
          <div className="chips" role="tablist" aria-label="Date range">
            {(
              [
                ["all", "All dates"],
                ["daily", "Daily"],
                ["weekly", "Week to date"],
              ] as [DatePreset, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={datePreset === value}
                className={datePreset === value ? "chip active" : "chip"}
                onClick={() => {
                  setPage(1);
                  setDatePreset(value);
                  setCustomOpen(false);
                }}
              >
                {label}
              </button>
            ))}
            <Popover
              open={customOpen}
              onOpenChange={(open) => {
                setCustomOpen(open);
                if (open) {
                  const today = todayInAddis();
                  setPage(1);
                  setDatePreset("custom");
                  setCustomFrom((current) => current || today);
                  setCustomTo((current) => current || today);
                }
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  aria-selected={datePreset === "custom"}
                  className={datePreset === "custom" ? "chip active" : "chip"}
                >
                  Custom
                </button>
              </PopoverTrigger>
              <PopoverContent className="custom-range-pop" align="start" sideOffset={8}>
                <div>
                  <p>From</p>
                  <Calendar
                    mode="single"
                    selected={parseIsoDate(customFrom)}
                    onSelect={(date) => {
                      if (!date) return;
                      setPage(1);
                      setCustomFrom(toIsoDate(date));
                    }}
                    defaultMonth={parseIsoDate(customFrom)}
                  />
                </div>
                <div>
                  <p>To</p>
                  <Calendar
                    mode="single"
                    selected={parseIsoDate(customTo)}
                    onSelect={(date) => {
                      if (!date) return;
                      setPage(1);
                      setCustomTo(toIsoDate(date));
                    }}
                    defaultMonth={parseIsoDate(customTo)}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <input
            className="search"
            placeholder="Search number or plate"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <dl className="report-stats no-print">
        <div>
          <dt>Total trips</dt>
          <dd>{listLoading ? <span className="skel skel-stat" /> : counts.total}</dd>
        </div>
        <div>
          <dt>Paid</dt>
          <dd>{listLoading ? <span className="skel skel-stat" /> : counts.claimed}</dd>
        </div>
        <div>
          <dt>Unpaid</dt>
          <dd>{listLoading ? <span className="skel skel-stat" /> : counts.unclaimed}</dd>
        </div>
      </dl>

      <TicketTable
        tickets={tickets}
        busy={busy}
        loading={listLoading}
        pagination={pagination}
        onPageChange={setPage}
        onConfirmClaim={onConfirmClaim}
        onPrint={printTicket}
      />
    </div>
  );
}
