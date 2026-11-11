import { useEffect, useState } from 'react'

const TONE = {
  act: 'var(--color-act-strong)',
  watch: 'var(--color-watch-strong)',
  steady: 'var(--color-steady)',
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ScoreRing({ score, band, size = 'md' }) {
  const small = size === 'sm'
  const radius = small ? 16 : 30
  const box = small ? 48 : 84
  const stroke = small ? 4 : 6
  const center = box / 2
  const circumference = 2 * Math.PI * radius
  const target = circumference * (1 - score / 100)
  const reduce = reducedMotion()
  const [offset, setOffset] = useState(() => (reducedMotion() ? target : circumference))

  if (reduce && offset !== target) setOffset(target)

  useEffect(() => {
    if (reduce) return undefined
    const frame = requestAnimationFrame(() => setOffset(target))
    return () => cancelAnimationFrame(frame)
  }, [reduce, target])

  return (
    <svg
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      role="img"
      aria-label={`Балл ${score} из 100`}
      className="shrink-0"
    >
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#e7e0d4" strokeWidth={stroke} />
      <circle
        className="ring-value"
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={TONE[band]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center}
        y={small ? center + 4 : center + 6}
        textAnchor="middle"
        fontFamily="Unbounded, Manrope, sans-serif"
        fontSize={small ? 12 : 18}
        fontWeight="600"
        fill="#1c1915"
      >
        {score}
      </text>
    </svg>
  )
}
