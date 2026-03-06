export interface Provider {
  id: string
  name: string
  created_at: string
}

export interface IncomeEntry {
  id: string
  provider_id: string
  provider?: Provider
  amount_ars: number
  usd_rate: number
  amount_usd: number
  date: string // YYYY-MM
  notes?: string
  created_at: string
}

export type ExpenseCategory = 'alquiler' | 'servicios' | 'suscripciones' | 'seguros' | 'otros' | 'ahorros'

export interface ExpenseEntry {
  id: string
  category: ExpenseCategory
  is_fixed: boolean
  description?: string
  amount_ars: number
  date: string // YYYY-MM
  tags?: string[]
  created_at: string
}

export interface MonthlyTotal {
  date: string
  total_ars: number
  total_usd: number
}

export interface ProviderTotal {
  provider: Provider
  total_ars: number
  total_usd: number
  entries_count: number
}
