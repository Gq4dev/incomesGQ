'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Provider } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { calcUSD, formatUSD, formatARS, formatInputARS, parseInputARS } from '@/lib/utils/currency'
import { RefreshCw } from 'lucide-react'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

async function fetchBlueRate(): Promise<number> {
  const res = await fetch('https://dolarapi.com/v1/dolares/blue')
  if (!res.ok) throw new Error('No se pudo obtener la cotización')
  const data = await res.json()
  return data.venta as number
}

export default function NewIncomePage() {
  const supabase = createClient()
  const router = useRouter()

  const [providers, setProviders] = useState<Provider[]>([])
  const [providerId, setProviderId] = useState('')
  const [amountARS, setAmountARS] = useState('')
  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [rateLoading, setRateLoading] = useState(true)
  const [rateError, setRateError] = useState(false)
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadRate = useCallback(async () => {
    setRateLoading(true)
    setRateError(false)
    try {
      const rate = await fetchBlueRate()
      setUsdRate(rate)
    } catch {
      setRateError(true)
    } finally {
      setRateLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase
      .from('providers')
      .select('*')
      .order('name')
      .then(({ data }) => setProviders(data ?? []))
    loadRate()
  }, [loadRate])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = e.target.value.replace(/\./g, '')
    const cleaned = stripped.replace(/[^\d,]/g, '')
    setAmountARS(formatInputARS(cleaned))
  }

  const parsedARS = parseInputARS(amountARS)
  const previewUSD = parsedARS && usdRate ? formatUSD(calcUSD(parsedARS, usdRate)) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const ars = parseInputARS(amountARS)

    if (!providerId) return setError('Seleccioná un cliente.')
    if (!ars || ars <= 0) return setError('Ingresá un monto válido.')
    if (!usdRate) return setError('No se pudo obtener la cotización del dólar.')
    if (!date) return setError('Seleccioná una fecha.')

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado.'); setSaving(false); return }
    const { error: dbError } = await supabase.from('income_entries').insert({
      provider_id: providerId,
      amount_ars: ars,
      usd_rate: usdRate,
      date,
      notes: notes.trim() || null,
      user_id: user.id,
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/income')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Cargar ingreso</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccioná un cliente" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-1.5">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
          />
        </div>

        {/* Monto ARS */}
        <div className="space-y-1.5">
          <Label>Monto ($ARS)</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Ej: 500.000"
            value={amountARS}
            onChange={handleAmountChange}
          />
        </div>

        {/* Cotización dólar blue */}
        <div className="space-y-1.5">
          <Label>Cotización dólar blue</Label>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {rateLoading ? (
              <span className="text-muted-foreground">Obteniendo cotización...</span>
            ) : rateError ? (
              <span className="text-destructive">No se pudo obtener</span>
            ) : (
              <span className="font-semibold">{usdRate ? formatARS(usdRate) : '—'}</span>
            )}
            <button
              type="button"
              onClick={loadRate}
              disabled={rateLoading}
              className="ml-auto text-muted-foreground hover:text-foreground disabled:opacity-40"
              aria-label="Actualizar cotización"
            >
              <RefreshCw size={15} className={rateLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {previewUSD && (
            <p className="text-xs text-muted-foreground">
              Equivale a{' '}
              <span className="font-semibold text-foreground">{previewUSD}</span>
            </p>
          )}
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label>Notas (opcional)</Label>
          <Input
            placeholder="Observaciones"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={saving || rateLoading}>
          {saving ? 'Guardando...' : 'Guardar ingreso'}
        </Button>
      </form>
    </div>
  )
}
