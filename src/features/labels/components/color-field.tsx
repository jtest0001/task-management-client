import { Input } from "@/components/ui/input"

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

interface ColorFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

/**
 * A native `<input type="color">` swatch plus the hex text input side by side, both writing the
 * same form field. The swatch alone is opaque to a screen reader and the design spec deliberately
 * shows the hex string, so the text input stays the primary, always-visible control — Zod
 * validates the hex regardless, so the picker is never the only path in.
 */
export function ColorField({ id, value, onChange, onBlur, disabled, ...aria }: ColorFieldProps) {
  const swatchId = `${id}-swatch`
  const swatchValue = HEX_COLOR.test(value) ? value : "#000000"

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={swatchId} className="sr-only">
        Color swatch
      </label>
      <input
        id={swatchId}
        type="color"
        value={swatchValue}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background h-9 w-9 shrink-0 cursor-pointer rounded-lg border p-1 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Input
        id={id}
        value={value}
        placeholder="#0A7F78"
        disabled={disabled}
        className="bg-background"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        {...aria}
      />
    </div>
  )
}
