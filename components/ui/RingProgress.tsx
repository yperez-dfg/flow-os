interface RingProgressProps {
  value: number        // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export default function RingProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#00d084',
  label,
}: RingProgressProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(value, 100) / 100) * circ

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {label && (
        <div className="absolute text-center">
          <span className="font-mono text-xs text-[#6E6E73] whitespace-pre-line">{label}</span>
        </div>
      )}
    </div>
  )
}
