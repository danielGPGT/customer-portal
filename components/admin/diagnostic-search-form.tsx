'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function DiagnosticSearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [type, setType] = useState<'email' | 'name'>(
    (searchParams.get('type') as 'email' | 'name') || 'email'
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const params = new URLSearchParams()
    params.set('q', query.trim())
    params.set('type', type)
    router.push(`/diagnostics?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex rounded-md border border-input overflow-hidden">
        <button
          type="button"
          onClick={() => setType('email')}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            type === 'email'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setType('name')}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            type === 'name'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Name
        </button>
      </div>
      <div className="flex-1">
        <Input
          type={type === 'email' ? 'email' : 'text'}
          placeholder={type === 'email' ? 'customer@example.com' : 'John Smith'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={!query.trim()}>
        <Search className="h-4 w-4 mr-2" />
        Diagnose
      </Button>
    </form>
  )
}
