import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'

interface BadgeProps {
  status: string
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function StatusBadge({ status }: BadgeProps) {
  const color = STATUS_COLORS[status] ?? '#9CA3AF'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-sans font-600 uppercase tracking-wide"
      style={{
        backgroundColor: hexToRgba(color, 0.1),
        color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
