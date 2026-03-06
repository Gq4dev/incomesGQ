import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { IncomeEntry, Provider } from '@/types'
import { formatARS, formatUSD } from '@/lib/utils/currency'
import { formatMonthYear } from '@/lib/utils/date'
import { usePrivacyMode } from '@/hooks/usePrivacyMode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { MonthlyChart, ChartEntry } from '@/components/income/MonthlyChart'
import { cn } from '@/lib/utils'

export default function IncomePage() {
  const supabase = createClient()
  const { mask } = usePrivacyMode()

  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [filterProvider, setFilterProvider] = useState('all')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(true)
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    const [{ data: entriesData }, { data: providersData }] = await Promise.all([
      supabase
        .from('income_entries')
        .select('*, provider:providers(id, name, created_at)')
        .order('date', { ascending: false }),
      supabase.from('providers').select('*').order('name'),
    ])
    setEntries(entriesData ?? [])
    setProviders(providersData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = entries.filter((e) => {
    const matchProvider = filterProvider === 'all' || e.provider_id === filterProvider
    const matchYear = e.date.startsWith(filterYear)
    return matchProvider && matchYear
  })

  const totalARS = filtered.reduce((s, e) => s + e.amount_ars, 0)
  const totalUSD = filtered.reduce((s, e) => s + e.amount_usd, 0)

  const chartData = Object.values(
    filtered.reduce<Record<string, { date: string; [key: string]: number | string }>>(
      (acc, e) => {
        if (!acc[e.date]) acc[e.date] = { date: e.date }
        acc[e.date][e.provider_id] = ((acc[e.date][e.provider_id] as number) || 0) + e.amount_ars
        return acc
      },
      {}
    )
  )

  const activeProviderIds = new Set(filtered.map((e) => e.provider_id))
  const chartProviders = providers.filter((p) => activeProviderIds.has(p.id))

  const byMonth = filtered.reduce<Record<string, IncomeEntry[]>>((acc, e) => {
    acc[e.date] = acc[e.date] ? [...acc[e.date], e] : [e]
    return acc
  }, {})
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a))
  const years = [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a))

  const initializedRef = useRef(false)
  useEffect(() => {
    if (!initializedRef.current && months.length > 0) {
      initializedRef.current = true
      setOpenMonths(new Set([months[0]]))
    }
  }, [months])

  async function deleteEntry(id: string) {
    await supabase.from('income_entries').delete().eq('id', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function toggleMonth(month: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev)
      next.has(month) ? next.delete(month) : next.add(month)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ingresos</h1>
        <Button asChild size="sm">
          <Link to="/income/new">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Link>
        </Button>
      </div>

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

        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between px-5 py-4 md:flex-col md:items-start md:py-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Total ARS
            </p>
            <p className="text-2xl font-bold tabular-nums leading-none tracking-tight md:mt-2">
              {mask(formatARS(totalARS))}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between px-5 py-4 md:flex-col md:items-start md:py-5">
            <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-widest">
              Total USD
            </p>
            <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-primary md:mt-2">
              {mask(formatUSD(totalUSD))}
            </p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Ingresos por mes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <MonthlyChart data={chartData as ChartEntry[]} providers={chartProviders} />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : months.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay ingresos para este período.</p>
      ) : (
        <div className="space-y-5">
          {months.map((month) => {
            const monthEntries = byMonth[month]
            const monthARS = monthEntries.reduce((s, e) => s + e.amount_ars, 0)
            const monthUSD = monthEntries.reduce((s, e) => s + e.amount_usd, 0)

            return (
              <Collapsible
                key={month}
                open={openMonths.has(month)}
                onOpenChange={() => toggleMonth(month)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-1 py-1 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <ChevronDown className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                        openMonths.has(month) ? 'rotate-0' : '-rotate-90'
                      )} />
                      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">
                        {formatMonthYear(month)}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {mask(formatARS(monthARS))}
                      </p>
                      <p className="text-xs text-primary font-medium tabular-nums">
                        {mask(formatUSD(monthUSD))}
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
                    {monthEntries.map((entry, i) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          i < monthEntries.length - 1 ? 'border-b border-border/60' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">
                              {entry.provider?.name ?? '—'}
                            </span>
                            {entry.notes && (
                              <Badge variant="secondary" className="text-[10px] shrink-0 h-4 px-1.5">
                                {entry.notes}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            TC {mask(String(entry.usd_rate))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <div className="text-right">
                            <p className="text-[13px] font-semibold tabular-nums">
                              {mask(formatARS(entry.amount_ars))}
                            </p>
                            <p className="text-[12px] text-primary font-medium tabular-nums">
                              {mask(formatUSD(entry.amount_usd))}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      )}
    </div>
  )
}
