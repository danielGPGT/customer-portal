import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Status = 'ok' | 'warning' | 'error' | 'info'

const statusColors: Record<Status, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ok: 'default',
  warning: 'secondary',
  error: 'destructive',
  info: 'outline',
}

const statusLabels: Record<Status, string> = {
  ok: 'OK',
  warning: 'Warning',
  error: 'Error',
  info: 'Info',
}

export function DiagnosticSection({
  title,
  description,
  status,
  children,
}: {
  title: string
  description?: string
  status?: Status
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {status && (
            <Badge variant={statusColors[status]}>{statusLabels[status]}</Badge>
          )}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function DiagnosticRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: React.ReactNode
  highlight?: 'error' | 'warning' | 'success'
}) {
  const colorClass = highlight === 'error'
    ? 'text-destructive font-medium'
    : highlight === 'warning'
    ? 'text-amber-600 font-medium'
    : highlight === 'success'
    ? 'text-green-600 font-medium'
    : 'text-foreground'

  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right break-all ${colorClass}`}>{value ?? '—'}</span>
    </div>
  )
}
