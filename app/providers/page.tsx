'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Provider } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

export default function ProvidersPage() {
  const supabase = createClient()
  const [providers, setProviders] = useState<Provider[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchProviders() {
    const { data } = await supabase
      .from('providers')
      .select('*')
      .order('name')
    setProviders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchProviders() }, [])

  async function addProvider() {
    const name = newName.trim()
    if (!name) return
    await supabase.from('providers').insert({ name })
    setNewName('')
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
      <div className="flex gap-2">
        <Input
          placeholder="Nombre del cliente"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addProvider()}
          className="flex-1"
        />
        <Button onClick={addProvider} size="icon" aria-label="Agregar">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : providers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No hay clientes aún. Agregá el primero.
        </p>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-3 py-3 px-4">
                {editingId === p.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(p.id)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600"
                      onClick={() => saveEdit(p.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-sm">{p.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => { setEditingId(p.id); setEditingName(p.name) }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteProvider(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
