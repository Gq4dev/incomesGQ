'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { IncomeEntry, ExpenseEntry } from '@/types'
import { formatARS } from '@/lib/utils/currency'
import { formatMonthYear } from '@/lib/utils/date'
import { usePrivacyMode } from '@/hooks/usePrivacyMode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

function CustomTooltip({ active, payload, label, mask }: any) {
  if (!active || !payload?.length) return null
  const ingresos = payload.find((p: any) => p.dataKey === 'ingresos')?.value ?? 0
  const egresos = payload.find((p: any) => p.dataKey === 'egresos')?.value ?? 0
  const neto = ingresos - egresos
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2.5 text-xs shadow-lg min-w-[160px]">
      <p className="font-semibold mb-2 capitalize text-foreground">{formatMonthYear(label)}</p>
      <div className="flex justify-between gap-3 mb-1">
        <span className="text-muted-foreground flex items-center gap-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(264, 70%, 55%)' }} />
          Ingresos
        </span>
        <span className="font-semibold tabular-nums">{mask(formatARS(ingresos))}</span>
      </div>
      <div className="flex justify-between gap-3 mb-1">
        <span className="text-muted-foreground flex items-center gap-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(0, 72%, 51%)' }} />
          Egresos
        </span>
        <span className="font-semibold tabular-nums">{mask(formatARS(egresos))}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
        <span className="text-muted-foreground">Neto</span>
        <span className={cn('font-bold tabular-nums', neto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
          {mask(formatARS(neto))}
        </span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const { mask } = usePrivacyMode()

  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [{ data: income }, { data: expenses }] = await Promise.all([
      supabase.from('income_entries').select('*').order('date', { ascending: false }),
      supabase.from('expense_entries').select('*').order('date', { ascending: false }),
    ])
    setIncomeEntries(income ?? [])
    setExpenseEntries(expenses ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredIncome = incomeEntries.filter((e) => e.date.startsWith(filterYear))
  const filteredExpenses = expenseEntries.filter((e) => e.date.startsWith(filterYear))

  const totalIngresos = filteredIncome.reduce((s, e) => s + e.amount_ars, 0)
  const totalEgresos = filteredExpenses.reduce((s, e) => s + e.amount_ars, 0)
  const neto = totalIngresos - totalEgresos

  const allMonths = new Set([
    ...filteredIncome.map((e) => e.date),
    ...filteredExpenses.map((e) => e.date),
  ])
  const chartData = [...allMonths]
    .sort((a, b) => a.localeCompare(b))
    .map((month) => {
      const ing = filteredIncome.filter((e) => e.date === month).reduce((s, e) => s + e.amount_ars, 0)
      const egr = filteredExpenses.filter((e) => e.date === month).reduce((s, e) => s + e.amount_ars, 0)
      return { date: month, ingresos: ing, egresos: egr, neto: ing - egr }
    })

  const years = [
    ...new Set([
      ...incomeEntries.map((e) => e.date.slice(0, 4)),
      ...expenseEntries.map((e) => e.date.slice(0, 4)),
    ]),
  ].sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Resumen</h1>

      {/* Filtro año */}
      <div className="flex gap-2">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.length === 0
              ? <SelectItem value={filterYear}>{filterYear}</SelectItem>
              : years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)
            }
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : (
        <>
          {/* Cards Ingresos + Egresos */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <Card className="shadow-sm border-primary/20 bg-primary/5">
              <CardContent className="px-4 py-3 md:py-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">
                    Ingresos
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums leading-none tracking-tight text-primary">
                  {mask(formatARS(totalIngresos))}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-destructive/20 bg-destructive/5">
              <CardContent className="px-4 py-3 md:py-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  <p className="text-[10px] font-semibold text-destructive/70 uppercase tracking-widest">
                    Egresos
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums leading-none tracking-tight text-destructive">
                  {mask(formatARS(totalEgresos))}
                </p>
              </CardContent>
            </Card>
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

          {/* Gráfico comparativo */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Ingresos vs Egresos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <div className="w-full h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
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
                      <Tooltip content={<CustomTooltip mask={mask} />} cursor={false} />
                      <Legend
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        formatter={(value) =>
                          value === 'ingresos' ? 'Ingresos' : value === 'egresos' ? 'Egresos' : 'Neto'
                        }
                      />
                      <Bar dataKey="ingresos" fill="hsl(264, 70%, 55%)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="egresos" fill="hsl(0, 72%, 51%)" radius={[3, 3, 0, 0]} />
                      <Line
                        dataKey="neto"
                        type="monotone"
                        stroke="hsl(152, 57%, 40%)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'hsl(152, 57%, 40%)' }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links rápidos */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/income"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card shadow-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Ingresos</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/expenses"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card shadow-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Egresos</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
