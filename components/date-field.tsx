"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseIsoDate, toIsoDate } from "@/lib/tickets";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DateField({ value, onChange }: DateFieldProps) {
  const selected = parseIsoDate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="date-field-trigger">
          <CalendarIcon size={16} aria-hidden="true" />
          <span>{selected ? format(selected, "MMM d, yyyy") : "Pick a date"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="date-field-popover" align="start" sideOffset={8}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(toIsoDate(date));
          }}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
