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
import { formatInputARS, parseInputARS } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'suscripciones', label: 'Suscripciones' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otros', label: 'Otros' },
  { value: 'ahorros', label: 'Ahorros' },
]

export default function NewExpensePage() {
  const supabase = createClient()
  const router = useRouter()

  const [isFixed, setIsFixed] = useState(true)
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [description, setDescription] = useState('')
  const [amountARS, setAmountARS] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = e.target.value.replace(/\./g, '')
    const cleaned = stripped.replace(/[^\d,]/g, '')
    setAmountARS(formatInputARS(cleaned))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const ars = parseInputARS(amountARS)

    if (!category) return setError('Seleccioná una categoría.')
    if (!ars || ars <= 0) return setError('Ingresá un monto válido.')
    if (!date) return setError('Seleccioná una fecha.')

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
            inputMode="numeric"
            placeholder="Ej: 150.000"
            value={amountARS}
            onChange={handleAmountChange}
          />
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar egreso'}
        </Button>
      </form>
    </div>
  )
}
