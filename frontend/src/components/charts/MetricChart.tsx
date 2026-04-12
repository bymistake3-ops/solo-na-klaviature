'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartType } from '@/types/dashboard'
import { ChartData } from '@/types/api'
import { AVAILABLE_METRICS } from '@/types/dashboard'
import { formatAxisValue, formatMetricValue } from '@/lib/formatters'

interface MetricChartProps {
  chart_type: ChartType
  metrics: string[]
  data: ChartData[]
  height?: number
  title?: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#14b8a6']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>
      {payload.map((entry: { color: string; name: string; value: number; dataKey: string }, i: number) => {
        const metric = AVAILABLE_METRICS.find((m) => m.key === entry.dataKey)
        return (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{metric?.label || entry.name}:</span>{' '}
            {metric
              ? formatMetricValue(entry.value, metric.unit)
              : entry.value.toLocaleString('ru-RU')}
          </p>
        )
      })}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry: { color: string; value: string }, i: number) => {
        const metric = AVAILABLE_METRICS.find((m) => m.key === entry.value)
        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-gray-600">{metric?.label || entry.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function MetricChart({ chart_type, metrics, data, height = 300 }: MetricChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ height }}
      >
        Нет данных для отображения
      </div>
    )
  }

  const firstMetric = AVAILABLE_METRICS.find((m) => m.key === metrics[0])
  const unit = firstMetric?.unit || 'count'

  const formatYAxis = (value: number) => formatAxisValue(value, unit)

  const commonProps = {
    data,
    margin: { top: 5, right: 20, left: 10, bottom: 5 },
  }

  const renderXAxis = () => (
    <XAxis
      dataKey="period"
      tick={{ fontSize: 12, fill: '#6b7280' }}
      tickLine={false}
      axisLine={false}
    />
  )

  const renderYAxis = () => (
    <YAxis
      tickFormatter={formatYAxis}
      tick={{ fontSize: 12, fill: '#6b7280' }}
      tickLine={false}
      axisLine={false}
      width={60}
    />
  )

  const renderCartesianGrid = () => (
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
  )

  if (chart_type === 'pie') {
    const pieData = metrics.map((metricKey, i) => {
      const total = data.reduce((sum, d) => sum + (Number(d[metricKey]) || 0), 0)
      const metric = AVAILABLE_METRICS.find((m) => m.key === metricKey)
      return {
        name: metric?.label || metricKey,
        value: total,
        color: COLORS[i % COLORS.length],
      }
    })

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={Math.min(height / 2 - 20, 120)}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatMetricValue(value, unit)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chart_type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart {...commonProps}>
          {renderCartesianGrid()}
          {renderXAxis()}
          {renderYAxis()}
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {metrics.map((metricKey, i) => (
            <Bar
              key={metricKey}
              dataKey={metricKey}
              fill={COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (chart_type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart {...commonProps}>
          <defs>
            {metrics.map((metricKey, i) => (
              <linearGradient key={metricKey} id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {renderCartesianGrid()}
          {renderXAxis()}
          {renderYAxis()}
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {metrics.map((metricKey, i) => (
            <Area
              key={metricKey}
              type="monotone"
              dataKey={metricKey}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              fill={`url(#gradient-${metricKey})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // Default: line chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart {...commonProps}>
        {renderCartesianGrid()}
        {renderXAxis()}
        {renderYAxis()}
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        {metrics.map((metricKey, i) => (
          <Line
            key={metricKey}
            type="monotone"
            dataKey={metricKey}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
