interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  unit?: '%' | 'px'
}

export default function Slider({
  label,
  value,
  min,
  max,
  onChange,
  unit = '%',
}: SliderProps) {
  const valueText = `${value}${unit}`

  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3 text-sm text-text">
        <span>{label}</span>
        <span className="tabular-nums text-muted">{valueText}</span>
      </span>
      <input
        aria-label={label}
        aria-valuetext={valueText}
        className="w-full cursor-pointer accent-accent focus-visible:rounded"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}
