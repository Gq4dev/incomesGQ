'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { IncomeEntry, ExpenseEntry, ExpenseCategory, Provider } from '@/types'
import { formatARS } from '@/lib/utils/currency'
import { usePrivacyMode } from '@/hooks/usePrivacyMode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

const MONTH_LABELS = [
  { value: 'all', label: 'Todos los meses' },
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  alquiler: 'Alquiler',
  servicios: 'Servicios',
  suscripciones: 'Suscripciones',
  seguros: 'Seguros',
  otros: 'Otros',
  ahorros: 'Ahorros',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  alquiler:      'hsl(24,  90%, 55%)',
  servicios:     'hsl(210, 75%, 52%)',
  suscripciones: 'hsl(264, 70%, 55%)',
  seguros:       'hsl(152, 55%, 45%)',
  otros:         'hsl(215, 15%, 60%)',
  ahorros:       'hsl(45,  90%, 50%)',
}

const PROVIDER_COLORS = [
  'hsl(220, 70%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(300, 55%, 55%)',
  'hsl(30,  85%, 55%)',
  'hsl(0,   70%, 55%)',
  'hsl(180, 55%, 45%)',
  'hsl(60,  75%, 45%)',
  'hsl(240, 60%, 60%)',
]

function PieTooltip({ active, payload, mask }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-0.5">{name}</p>
      <p className="tabular-nums font-bold">{mask(formatARS(value))}</p>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const { mask } = usePrivacyMode()

  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState('all')
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [activeChart, setActiveChart] = useState(0)

  const fetchData = useCallback(async () => {
    const [{ data: income }, { data: expenses }, { data: provs }, { data: { user } }] = await Promise.all([
      supabase.from('income_entries').select('*').order('date', { ascending: false }),
      supabase.from('expense_entries').select('*').order('date', { ascending: false }),
      supabase.from('providers').select('*').order('name'),
      supabase.auth.getUser(),
    ])
    setIncomeEntries(income ?? [])
    setExpenseEntries(expenses ?? [])
    setProviders(provs ?? [])
    if (user) {
      const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      setUserName(name)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredIncome = incomeEntries.filter((e) => {
    const ym = e.date.slice(0, 7)
    if (!ym.startsWith(filterYear)) return false
    if (filterMonth !== 'all' && !ym.endsWith(`-${filterMonth}`)) return false
    return true
  })
  const filteredExpenses = expenseEntries.filter((e) => {
    const ym = e.date.slice(0, 7)
    if (!ym.startsWith(filterYear)) return false
    if (filterMonth !== 'all' && !ym.endsWith(`-${filterMonth}`)) return false
    return true
  })

  const totalIngresos = filteredIncome.reduce((s, e) => s + e.amount_ars, 0)
  const totalEgresos = filteredExpenses.reduce((s, e) => s + e.amount_ars, 0)
  const neto = totalIngresos - totalEgresos

  const totalAhorros = filteredExpenses
    .filter((e) => e.category === 'ahorros')
    .reduce((s, e) => s + e.amount_ars, 0)

  const expensePieData = Object.entries(
    filteredExpenses
      .filter((e) => e.category !== 'ahorros')
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount_ars
        return acc
      }, {})
  ).map(([category, value]) => ({
    name: CATEGORY_LABELS[category as ExpenseCategory],
    value,
    color: CATEGORY_COLORS[category as ExpenseCategory],
  }))

  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]))
  const incomePieData = Object.entries(
    filteredIncome.reduce<Record<string, number>>((acc, e) => {
      acc[e.provider_id] = (acc[e.provider_id] || 0) + e.amount_ars
      return acc
    }, {})
  ).map(([providerId, value], i) => ({
    name: providerMap[providerId] ?? providerId,
    value,
    color: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
  }))

  const charts = [
    { key: 'egresos', title: 'Egresos por categoría', data: expensePieData },
    { key: 'ingresos', title: 'Ingresos por cliente', data: incomePieData },
  ].filter((c) => c.data.length > 0)

  const years = [
    ...new Set([
      ...incomeEntries.map((e) => e.date.slice(0, 4)),
      ...expenseEntries.map((e) => e.date.slice(0, 4)),
    ]),
  ].sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-5">
      {userName && (
        <p className="text-sm text-muted-foreground">Hola, <span className="font-medium text-foreground capitalize">{userName}</span></p>
      )}

      <div className="flex gap-2">
        <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setFilterMonth('all') }}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.length === 0
              ? <SelectItem value={filterYear}>{filterYear}</SelectItem>
              : years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)
            }
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_LABELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : (
        <>
          {/* Cards Ingresos + Egresos */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <Link href="/income/new" className="block">
              <Card className="shadow-sm border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer h-full">
                <CardContent className="px-4 py-3 md:py-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Ingresos</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums leading-none tracking-tight text-primary">
                    {mask(formatARS(totalIngresos))}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/expenses/new" className="block">
              <Card className="shadow-sm border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer h-full">
                <CardContent className="px-4 py-3 md:py-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    <p className="text-[10px] font-semibold text-destructive/70 uppercase tracking-widest">Egresos</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums leading-none tracking-tight text-destructive">
                    {mask(formatARS(totalEgresos))}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Neto */}
          <Card className={cn(
            'shadow-sm',
            neto >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5'
          )}>
            <CardContent className="flex items-center justify-between px-5 py-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Resultado neto
              </p>
              <p className={cn(
                'text-2xl font-bold tabular-nums leading-none tracking-tight',
                neto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              )}>
                {mask(formatARS(neto))}
              </p>
            </CardContent>
          </Card>

          {/* Ahorros */}
          {totalAhorros > 0 && (
            <Card className="shadow-sm border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="flex items-center justify-between px-5 py-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Ahorros
                </p>
                <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-yellow-600 dark:text-yellow-400">
                  {mask(formatARS(totalAhorros))}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Carousel de gráficos */}
          {charts.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {charts[activeChart % charts.length].title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="w-full h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts[activeChart % charts.length].data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={2}
                      >
                        {charts[activeChart % charts.length].data.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip mask={mask} />} />
                      <Legend
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Dots */}
                {charts.length > 1 && (
                  <div className="flex justify-center gap-2 mt-2">
                    {charts.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveChart(i)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          i === activeChart % charts.length
                            ? 'bg-foreground'
                            : 'bg-muted-foreground/30'
                        )}
                        aria-label={charts[i].title}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </>
      )}
    </div>
  )
}
