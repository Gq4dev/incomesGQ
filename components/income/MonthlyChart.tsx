import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { usePrivacyMode } from '@/hooks/usePrivacyMode'
import { formatARS } from '@/lib/utils/currency'
import { formatMonthYear } from '@/lib/utils/date'
import { Provider } from '@/types'

// Paleta de colores para los proveedores
const COLORS = [
  'hsl(264, 70%, 55%)',  // indigo (primary)
  'hsl(200, 65%, 50%)',  // cyan
  'hsl(150, 55%, 48%)',  // green
  'hsl(35, 80%, 55%)',   // amber
  'hsl(330, 65%, 55%)',  // pink
  'hsl(20, 75%, 55%)',   // orange
  'hsl(280, 60%, 58%)',  // purple
  'hsl(170, 60%, 45%)',  // teal
]

export interface ChartEntry {
  date: string
  [providerId: string]: number | string
}

interface Props {
  data: ChartEntry[]
  providers: Provider[]
}

function CustomTooltip({ active, payload, label, providers, mask }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2.5 text-xs shadow-lg min-w-[160px]">
      <p className="font-semibold mb-2 capitalize text-foreground">{formatMonthYear(label)}</p>
      {payload.map((p: any) => {
        const provider = providers.find((pr: Provider) => pr.id === p.dataKey)
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
              <span className="text-muted-foreground truncate max-w-[90px]">
                {provider?.name ?? p.dataKey}
              </span>
            </div>
            <span className="font-semibold tabular-nums">{mask(formatARS(p.value))}</span>
          </div>
        )
      })}
      {payload.length > 1 && (
        <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold tabular-nums">{mask(formatARS(total))}</span>
        </div>
      )}
    </div>
  )
}

export function MonthlyChart({ data, providers }: Props) {
  const { mask } = usePrivacyMode()

  const sorted = [...data].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  if (sorted.length === 0) return null

  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="28%">
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              const [, month] = String(v).split('-')
              return new Date(2000, Number(month) - 1).toLocaleString('es-AR', { month: 'short' })
            }}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            content={<CustomTooltip providers={providers} mask={mask} />}
            cursor={false}
          />
          {providers.map((provider, i) => (
            <Bar
              key={provider.id}
              dataKey={provider.id}
              name={provider.name}
              stackId="a"
              fill={COLORS[i % COLORS.length]}
              radius={i === providers.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
