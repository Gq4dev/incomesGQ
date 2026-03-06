import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IncomeEntry, Provider } from '@/types'
import { calcUSD, formatUSD } from '@/lib/utils/currency'
import { monthOptions } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  entry: IncomeEntry | null
  providers: Provider[]
  onClose: () => void
  onSaved: () => void
}

export function EditIncomeSheet({ entry, providers, onClose, onSaved }: Props) {
  const supabase = createClient()

  const [providerId, setProviderId] = useState('')
  const [amountARS, setAmountARS] = useState('')
  const [usdRate, setUsdRate] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry) {
      setProviderId(entry.provider_id)
      setAmountARS(String(entry.amount_ars))
      setUsdRate(String(entry.usd_rate))
      setDate(entry.date)
      setNotes(entry.notes ?? '')
      setError('')
    }
  }, [entry])

  const previewUSD =
    amountARS && usdRate
      ? formatUSD(calcUSD(Number(amountARS.replace(/\./g, '').replace(',', '.')), Number(usdRate.replace(',', '.'))))
      : null

  async function handleSave() {
    setError('')
    const ars = Number(amountARS.replace(/\./g, '').replace(',', '.'))
    const rate = Number(usdRate.replace(',', '.'))

    if (!providerId) return setError('Seleccioná un cliente.')
    if (!ars || ars <= 0) return setError('Monto inválido.')
    if (!rate || rate <= 0) return setError('Tipo de cambio inválido.')

    setSaving(true)
    const { error: dbError } = await supabase
      .from('income_entries')
      .update({
        provider_id: providerId,
        amount_ars: ars,
        usd_rate: rate,
        date,
        notes: notes.trim() || null,
      })
      .eq('id', entry!.id)

    setSaving(false)
    if (dbError) return setError(dbError.message)
    onSaved()
    onClose()
  }

  return (
    <Sheet open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Editar ingreso</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccioná un cliente" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto ARS */}
          <div className="space-y-1.5">
            <Label>Monto ($ARS)</Label>
            <Input
              inputMode="decimal"
              value={amountARS}
              onChange={(e) => setAmountARS(e.target.value)}
            />
          </div>

          {/* TC */}
          <div className="space-y-1.5">
            <Label>Tipo de cambio (USD)</Label>
            <Input
              inputMode="decimal"
              value={usdRate}
              onChange={(e) => setUsdRate(e.target.value)}
            />
            {previewUSD && (
              <p className="text-xs text-muted-foreground">
                Equivale a <span className="font-semibold text-foreground">{previewUSD}</span>
              </p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
