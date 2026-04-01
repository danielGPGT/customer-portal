import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { DiagnosticIssue } from '@/app/(admin)/diagnostics/actions'

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const variantMap = {
  error: 'destructive' as const,
  warning: 'soft' as const,
  info: 'default' as const,
}

export function DiagnosticIssueBanner({ issues }: { issues: DiagnosticIssue[] }) {
  if (issues.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Diagnostic Issues ({issues.filter(i => i.severity !== 'info').length} problems found)
      </h3>
      {issues.map((issue, i) => {
        const Icon = iconMap[issue.severity]
        return (
          <Alert key={i} variant={variantMap[issue.severity]}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{issue.title}</AlertTitle>
            <AlertDescription>{issue.description}</AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
