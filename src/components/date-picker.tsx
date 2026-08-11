import { CalendarIcon } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/** `"2026-08-15"` -> a local midnight `Date`, so the calendar highlights the same day
 *  regardless of the browser's timezone. Wire-format conversion stays in `lib/utils/date.ts`;
 *  this is display-only. */
function parseDateOnly(value: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const displayFormatter = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" })

interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

/** Date-only picker: `value`/`onChange` are `"yyyy-mm-dd"` strings, matching what
 *  `<input type="date">` produced before it — form code and Zod schemas don't need to change. */
export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = "Pick a date",
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDateOnly(value)
  const labelId = useId()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          onBlur={onBlur}
          className={cn("w-full justify-start gap-2 font-normal", !selected && "text-muted-foreground")}
          {...aria}
        >
          <CalendarIcon className="size-4 shrink-0" aria-hidden="true" />
          <span id={labelId}>{selected ? displayFormatter.format(selected) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto gap-0 p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? formatDateOnly(date) : "")
            setOpen(false)
          }}
          autoFocus
        />
        {value ? (
          <div className="border-border flex justify-end border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
