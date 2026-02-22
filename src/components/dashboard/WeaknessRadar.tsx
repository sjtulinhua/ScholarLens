"use client"

import { useState } from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

export interface WeaknessData {
  name: string
  mastery: number // 0-100
  total: number
}

interface WeaknessRadarProps {
  data: WeaknessData[]
}

export function WeaknessRadar({ data }: WeaknessRadarProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground italic">
        暂无足够数据生成分析图表
      </div>
    )
  }

  return (
    <div className="w-full h-[300px] min-h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RadarChart 
          cx="50%" cy="50%" outerRadius="80%" data={data}
          onMouseMove={(state: any) => {
            if (state && state.activeLabel && state.activeLabel !== hoveredLabel) {
              setHoveredLabel(state.activeLabel)
            }
          }}
          onMouseLeave={() => setHoveredLabel(null)}
        >
          <PolarGrid stroke="#e5e5e5" />
          <PolarAngleAxis 
            dataKey="name" 
            tick={(props: any) => {
              const { payload, x, y, textAnchor } = props;
              const isHovered = hoveredLabel === payload.value;
              const isAnyHovered = hoveredLabel !== null;
              
              return (
                <text 
                  x={x} 
                  y={y} 
                  textAnchor={textAnchor}
                  fill={isHovered ? "#007AFF" : "#666"}
                  fillOpacity={isAnyHovered && !isHovered ? 0.3 : 1}
                  fontSize={isHovered ? 12 : 10}
                  fontWeight={isHovered ? "bold" : "normal"}
                  className="transition-all duration-300 pointer-events-none"
                >
                  {payload.value}
                </text>
              )
            }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#007AFF', fontWeight: 'bold' }}
            formatter={(value?: number) => [`${value ?? 0}% 掌握度`, '']}
          />
          <Radar
            name="Mastery"
            dataKey="mastery"
            stroke="#007AFF"
            fill="#007AFF"
            fillOpacity={hoveredLabel ? 0.7 : 0.4}
            activeDot={{ r: 8, fill: "#007AFF", stroke: "#fff", strokeWidth: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
