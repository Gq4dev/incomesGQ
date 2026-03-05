'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ExpenseEntry, ExpenseCategory } from '@/types'
import { formatARS } from '@/lib/utils/currency'
import { formatMonthYear } from '@/lib/utils/date'
import { usePrivacyMode } from '@/hooks/usePrivacyMode'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  alquiler: 'Alquiler',
  servicios: 'Servicios',
  suscripciones: 'Suscripciones',
  seguros: 'Seguros',
  otros: 'Otros',
  ahorros: 'Ahorros',
}

export default function ExpensesPage() {
  const supabase = createClient()
  const { mask } = usePrivacyMode()

  const [entries, setEntries] = useState<ExpenseEntry[]>([])
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(true)
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('expense_entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function deleteEntry(id: string) {
    await supabase.from('expense_entries').delete().eq('id', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const filtered = entries.filter((e) => e.date.startsWith(filterYear))
  const totalFijos = filtered.filter((e) => e.is_fixed).reduce((s, e) => s + e.amount_ars, 0)
  const totalVariables = filtered.filter((e) => !e.is_fixed).reduce((s, e) => s + e.amount_ars, 0)

  const byMonth = filtered.reduce<Record<string, ExpenseEntry[]>>((acc, e) => {
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
        <h1 className="text-xl font-semibold">Egresos</h1>
        <Button asChild size="sm">
          <Link href="/expenses/new">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Link>
        </Button>
      </div>

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

      {/* Totales */}
      <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between px-5 py-4 md:flex-col md:items-start md:py-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Fijos
            </p>
            <p className="text-2xl font-bold tabular-nums leading-none tracking-tight">
              {mask(formatARS(totalFijos))}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center justify-between px-5 py-4 md:flex-col md:items-start md:py-5">
            <p className="text-[11px] font-semibold text-destructive/70 uppercase tracking-widest">
              Variables
            </p>
            <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-destructive">
              {mask(formatARS(totalVariables))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista por mes */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : months.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay egresos para este período.</p>
      ) : (
        <div className="space-y-5">
          {months.map((month) => {
            const monthEntries = byMonth[month]
            const monthTotal = monthEntries.reduce((s, e) => s + e.amount_ars, 0)

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
                    <p className="text-sm font-bold tabular-nums">
                      {mask(formatARS(monthTotal))}
                    </p>
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
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">
                              {CATEGORY_LABELS[entry.category]}
                            </span>
                            <Badge
                              variant={entry.is_fixed ? 'secondary' : 'outline'}
                              className="text-[10px] shrink-0 h-4 px-1.5"
                            >
                              {entry.is_fixed ? 'Fijo' : 'Variable'}
                            </Badge>
                          </div>
                          {entry.description && (
                            <span className="text-[11px] text-muted-foreground">
                              {entry.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <p className="text-[13px] font-semibold tabular-nums">
                            {mask(formatARS(entry.amount_ars))}
                          </p>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
