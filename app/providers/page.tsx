'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Provider } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

export default function ProvidersPage() {
  const supabase = createClient()
  const [providers, setProviders] = useState<Provider[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchProviders() {
    const { data } = await supabase
      .from('providers')
      .select('*')
      .order('name')
    setProviders(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProviders()
    inputRef.current?.focus()
  }, [])

  async function addProvider() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado.'); setAdding(false); return }
    const { error: dbError } = await supabase.from('providers').insert({ name, user_id: user.id })
    if (dbError) {
      setError(dbError.message)
      setAdding(false)
      return
    }
    setNewName('')
    setAdding(false)
    fetchProviders()
  }

  async function deleteProvider(id: string) {
    await supabase.from('providers').delete().eq('id', id)
    fetchProviders()
  }

  async function saveEdit(id: string) {
    const name = editingName.trim()
    if (!name) return
    await supabase.from('providers').update({ name }).eq('id', id)
    setEditingId(null)
    fetchProviders()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Clientes</h1>

      {/* Add form */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Nombre del cliente"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProvider()}
            className="flex-1"
            disabled={adding}
          />
          <Button
            onClick={addProvider}
            size="icon"
            aria-label="Agregar"
            disabled={adding || !newName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : providers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay clientes aún. Agregá el primero.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {providers.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-4 py-2.5 ${
                i < providers.length - 1 ? 'border-b border-border/60' : ''
              }`}
            >
              {editingId === p.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(p.id)}
                    className="flex-1 h-7 text-sm"
                    autoFocus
                  />
                  <button
                    className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                    onClick={() => saveEdit(p.id)}
                    aria-label="Guardar"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setEditingId(null)}
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setEditingId(p.id); setEditingName(p.name) }}
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => deleteProvider(p.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
