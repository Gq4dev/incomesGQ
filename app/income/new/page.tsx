'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Provider } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { calcUSD, formatUSD } from '@/lib/utils/currency'
import { currentYearMonth, monthOptions } from '@/lib/utils/date'

export default function NewIncomePage() {
  const supabase = createClient()
  const router = useRouter()

  const [providers, setProviders] = useState<Provider[]>([])
  const [providerId, setProviderId] = useState('')
  const [amountARS, setAmountARS] = useState('')
  const [usdRate, setUsdRate] = useState('')
  const [date, setDate] = useState(currentYearMonth())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('providers')
      .select('*')
      .order('name')
      .then(({ data }) => setProviders(data ?? []))
  }, [])

  const previewUSD =
    amountARS && usdRate
      ? formatUSD(calcUSD(Number(amountARS.replace(/\./g, '').replace(',', '.')), Number(usdRate.replace(',', '.'))))
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const ars = Number(amountARS.replace(/\./g, '').replace(',', '.'))
    const rate = Number(usdRate.replace(',', '.'))

    if (!providerId) return setError('Seleccioná un cliente.')
    if (!ars || ars <= 0) return setError('Ingresá un monto válido.')
    if (!rate || rate <= 0) return setError('Ingresá el tipo de cambio.')

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado.'); setSaving(false); return }
    const { error: dbError } = await supabase.from('income_entries').insert({
      provider_id: providerId,
      amount_ars: ars,
      usd_rate: rate,
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

        {/* Período */}
        <div className="space-y-1.5">
          <Label>Período</Label>
          <Select value={date} onValueChange={setDate}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions().map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monto ARS */}
        <div className="space-y-1.5">
          <Label>Monto ($ARS)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Ej: 500000"
            value={amountARS}
            onChange={(e) => setAmountARS(e.target.value)}
          />
        </div>

        {/* Tipo de cambio */}
        <div className="space-y-1.5">
          <Label>Tipo de cambio (USD)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Ej: 1250"
            value={usdRate}
            onChange={(e) => setUsdRate(e.target.value)}
          />
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

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar ingreso'}
        </Button>
      </form>
    </div>
  )
}
