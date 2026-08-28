"use client";

import { formatPaidAt, type TicketDTO } from "@/lib/tickets";
import { MarkPaidButton } from "@/components/mark-paid-button";

type Pagination = {
  page: number;
  pageSize: number;
  matched: number;
  pageCount: number;
};

type TicketTableProps = {
  tickets: TicketDTO[];
  busy: boolean;
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onConfirmClaim: (number: number) => void;
  onPrint: (id: string) => void;
};

export function TicketTable({
  tickets,
  busy,
  loading,
  pagination,
  onPageChange,
  onConfirmClaim,
  onPrint,
}: TicketTableProps) {
  const from = pagination.matched === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.matched);

  return (
    <div className="report-block">
      {loading ? (
        <div className="report-wrap" aria-busy="true" aria-live="polite">
          <table className="report-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Date</th>
                <th>Driver</th>
                <th>Plate</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid date</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: pagination.pageSize }, (_, row) => (
                <tr key={row}>
                  {Array.from({ length: 11 }, (__, col) => (
                    <td key={col}>
                      <span className="skel" style={{ width: col === 10 ? "72%" : col === 2 ? "88%" : "64%" }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tickets.length === 0 ? (
        <p className="empty no-print">No tickets match this report.</p>
      ) : (
        <div className="report-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Date</th>
                <th>Driver</th>
                <th>Plate</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid date</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const claimed = ticket.status === "claimed";
                return (
                  <tr key={ticket.id} data-status={ticket.status}>
                    <td className="num">{ticket.numberLabel}</td>
                    <td>{ticket.date}</td>
                    <td>{ticket.driverName}</td>
                    <td>{ticket.plateNumber}</td>
                    <td>{ticket.type}</td>
                    <td>{ticket.origin}</td>
                    <td>{ticket.destination}</td>
                    <td className="num">{ticket.amountBirr}</td>
                    <td>{claimed ? "Paid" : "Unpaid"}</td>
                    <td className="num">{formatPaidAt(ticket.claimedAt)}</td>
                    <td className="no-print">
                      <div className="table-actions">
                        {claimed ? (
                          <span className="paid-pill">Paid</span>
                        ) : (
                          <MarkPaidButton ticketNumber={ticket.number} busy={busy} onConfirm={onConfirmClaim} />
                        )}
                        <button type="button" className="btn btn-print" onClick={() => onPrint(ticket.id)}>
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="pager no-print">
        <p>
          {loading
            ? "Loading…"
            : pagination.matched === 0
              ? "0 tickets"
              : `${from}–${to} of ${pagination.matched}`}
        </p>
        <div className="pager-buttons">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loading || pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pageCount}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loading || pagination.page >= pagination.pageCount}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
