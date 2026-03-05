export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUSD(amount: number): string {
  return `U$D ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`
}

export function calcUSD(amountARS: number, rate: number): number {
  if (!rate || rate === 0) return 0
  return amountARS / rate
}

// Formats raw string with thousand separator (.) while typing
export function formatInputARS(raw: string): string {
  const [int, dec] = raw.split(',')
  const formatted = (int || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return dec !== undefined ? `${formatted},${dec}` : formatted
}

// Strips formatting and returns number
export function parseInputARS(formatted: string): number {
  return Number(formatted.replace(/\./g, '').replace(',', '.'))
}
