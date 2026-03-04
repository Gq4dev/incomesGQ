'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ExpenseCategory } from '@/types'
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
import { currentYearMonth, monthOptions } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'suscripciones', label: 'Suscripciones' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otros', label: 'Otros' },
]

export default function NewExpensePage() {
  const supabase = createClient()
  const router = useRouter()

  const [isFixed, setIsFixed] = useState(true)
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [description, setDescription] = useState('')
  const [amountARS, setAmountARS] = useState('')
  const [date, setDate] = useState(currentYearMonth())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const ars = Number(amountARS.replace(/\./g, '').replace(',', '.'))

    if (!category) return setError('Seleccioná una categoría.')
    if (!ars || ars <= 0) return setError('Ingresá un monto válido.')

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado.'); setSaving(false); return }
    const { error: dbError } = await supabase.from('expense_entries').insert({
      category,
      is_fixed: isFixed,
      description: description.trim() || null,
      amount_ars: ars,
      date,
      user_id: user.id,
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/expenses')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Cargar egreso</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo: Fijo / Variable */}
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsFixed(true)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                isFixed
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Fijo
            </button>
            <button
              type="button"
              onClick={() => setIsFixed(false)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                !isFixed
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Variable
            </button>
          </div>
        </div>

        {/* Categoría */}
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccioná una categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <Label>Descripción (opcional)</Label>
          <Input
            placeholder="Ej: Alquiler depto, Netflix, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Monto ARS */}
        <div className="space-y-1.5">
          <Label>Monto ($ARS)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Ej: 150000"
            value={amountARS}
            onChange={(e) => setAmountARS(e.target.value)}
          />
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

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar egreso'}
        </Button>
      </form>
    </div>
  )
}
