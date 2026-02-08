"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
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
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e5e5" />
          <PolarAngleAxis 
            dataKey="name" 
            tick={{ fill: "#666", fontSize: 12 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Mastery"
            dataKey="mastery"
            stroke="#007AFF"
            fill="#007AFF"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
