"use client"

import { motion } from "framer-motion"

interface ChartItem {
  date: string
  total: number
}

interface AreaChartProps {
  items: ChartItem[]
}

export default function AreaChart({ items = [] }: AreaChartProps) {
  if (!items || items.length === 0) return null

  const max = Math.max(...items.map(i => i.total), 1)
  const height = 150
  const width = 300
  const padding = 20

  const points = items.map((item, i) => {
    const x = (i / (items.length - 1 || 1)) * (width - padding * 2) + padding
    const y = height - (item.total / max) * (height - padding * 2) - padding
    return { x, y }
  })

  const pathData = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
  }, "")

  const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div className="w-full aspect-[2/1] relative mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        
        {/* Area */}
        <motion.path
          d={areaData}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        
        {/* Path */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="white"
            stroke="#2563eb"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        ))}

        {/* Labels (Simple) */}
        <g opacity="0.3">
          {items.map((item, i) => {
            if (i % Math.ceil(items.length / 4) !== 0) return null
            return (
              <text
                key={i}
                x={points[i].x}
                y={height + 5}
                textAnchor="middle"
                fontSize="6"
                fontWeight="bold"
                fill="#6b7280"
              >
                {item.date}
              </text>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
