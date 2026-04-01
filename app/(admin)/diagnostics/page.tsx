import { Suspense } from 'react'
import { DiagnosticSearchForm } from '@/components/admin/diagnostic-search-form'
import { DiagnosticIssueBanner } from '@/components/admin/diagnostic-issue-banner'
import { DiagnosticSection, DiagnosticRow } from '@/components/admin/diagnostic-section'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { runDiagnostics } from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const params = await searchParams
  const query = params.q
  const type = (params.type === 'name' ? 'name' : 'email') as 'email' | 'name'

  let result = null
  if (query) {
    result = await runDiagnostics(query, type)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Customer Diagnostics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search for a customer to diagnose why they may not be seeing their data.
        </p>
      </div>

      <Suspense>
        <DiagnosticSearchForm />
      </Suspense>

      {result && !result.success && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {result?.success && result.data && (
        <div className="space-y-4">
          {/* Issues Banner */}
          <DiagnosticIssueBanner issues={result.data.issues} />

          {/* Clerk Account */}
          <DiagnosticSection
            title="Clerk Account"
            description="Authentication provider status"
            status={result.data.clerk ? (result.data.clerk.banned ? 'error' : 'ok') : 'error'}
          >
            {result.data.clerk ? (
              <div className="divide-y">
                <DiagnosticRow label="Clerk User ID" value={
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.data.clerk.id}</code>
                } />
                <DiagnosticRow label="Email" value={result.data.clerk.email} />
                <DiagnosticRow label="Name" value={
                  [result.data.clerk.firstName, result.data.clerk.lastName].filter(Boolean).join(' ') || '—'
                } />
                <DiagnosticRow
                  label="Created"
                  value={new Date(result.data.clerk.createdAt).toLocaleString()}
                />
                <DiagnosticRow
                  label="Last Sign In"
                  value={result.data.clerk.lastSignInAt
                    ? new Date(result.data.clerk.lastSignInAt).toLocaleString()
                    : 'Never'
                  }
                  highlight={!result.data.clerk.lastSignInAt ? 'warning' : undefined}
                />
                <DiagnosticRow
                  label="Banned"
                  value={result.data.clerk.banned ? 'Yes' : 'No'}
                  highlight={result.data.clerk.banned ? 'error' : 'success'}
                />
                <DiagnosticRow label="Public Metadata" value={
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {JSON.stringify(result.data.clerk.publicMetadata)}
                  </code>
                } />
                {result.data.clerkMultiple && (
                  <DiagnosticRow
                    label="Multiple Accounts"
                    value="Yes — duplicate Clerk accounts detected"
                    highlight="warning"
                  />
                )}
                <div className="pt-3">
                  <a
                    href={`https://dashboard.clerk.com/users/${result.data.clerk.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View in Clerk Dashboard (impersonate from there)
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No Clerk account found.</p>
            )}
          </DiagnosticSection>

          {/* Client Linkage */}
          <DiagnosticSection
            title="Supabase Client Linkage"
            description="Bridge between Clerk auth and database records"
            status={
              result.data.linkageMatch === true ? 'ok'
              : result.data.linkageMatch === false ? 'error'
              : result.data.client ? 'warning' : 'error'
            }
          >
            {result.data.client ? (
              <div className="divide-y">
                <DiagnosticRow label="Client ID" value={
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.data.client.id}</code>
                } />
                <DiagnosticRow label="Email" value={result.data.client.email} />
                <DiagnosticRow
                  label="clerk_user_id"
                  value={result.data.client.clerk_user_id ? (
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.data.client.clerk_user_id}</code>
                  ) : 'NULL'}
                  highlight={!result.data.client.clerk_user_id ? 'error' : undefined}
                />
                <DiagnosticRow
                  label="Linkage Match"
                  value={
                    result.data.linkageMatch === true ? 'Clerk ID and email both resolve to same client'
                    : result.data.linkageMatch === false ? 'Mismatch — see issues above'
                    : 'Could not verify'
                  }
                  highlight={
                    result.data.linkageMatch === true ? 'success'
                    : result.data.linkageMatch === false ? 'error'
                    : 'warning'
                  }
                />
                <DiagnosticRow
                  label="Status"
                  value={result.data.client.status}
                  highlight={result.data.client.status === 'active' ? 'success' : 'warning'}
                />
                <DiagnosticRow label="Team ID" value={
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.data.client.team_id}</code>
                } />
                <DiagnosticRow label="Created" value={
                  result.data.client.created_at
                    ? new Date(result.data.client.created_at).toLocaleString()
                    : '—'
                } />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No client record found in database.</p>
            )}
          </DiagnosticSection>

          {/* Portal Access */}
          <DiagnosticSection
            title="Portal Access"
            description="Controls which portal the user can access"
            status={
              result.data.portalAccess.length === 0 ? 'info'
              : result.data.portalAccess.some(p => p.portal_type === 'client') ? 'ok'
              : 'warning'
            }
          >
            {result.data.portalAccess.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.data.portalAccess.map((p) => (
                  <Badge key={p.id} variant={p.portal_type === 'client' ? 'default' : 'secondary'}>
                    {p.portal_type}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No explicit portal access rows. Defaults to client portal access.
              </p>
            )}
          </DiagnosticSection>

          {/* Bookings */}
          <DiagnosticSection
            title="Bookings"
            description="All booking records for this customer"
            status={
              result.data.bookings.softDeleted > 0 ? 'warning'
              : result.data.bookings.total > 0 ? 'ok'
              : 'info'
            }
          >
            <div className="space-y-4">
              <div className="divide-y">
                <DiagnosticRow label="Total Bookings" value={result.data.bookings.total} />
                <DiagnosticRow
                  label="Active (visible)"
                  value={result.data.bookings.active}
                  highlight={result.data.bookings.active === 0 && result.data.bookings.total > 0 ? 'error' : undefined}
                />
                <DiagnosticRow
                  label="Soft-Deleted (hidden)"
                  value={result.data.bookings.softDeleted}
                  highlight={result.data.bookings.softDeleted > 0 ? 'warning' : undefined}
                />
              </div>

              {Object.keys(result.data.bookings.byStatus).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Active bookings by status:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.data.bookings.byStatus).map(([status, count]) => (
                      <Badge key={status} variant="outline">
                        {status}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.data.bookings.recent.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Recent bookings:</p>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Reference</th>
                          <th className="text-left p-2 font-medium">Status</th>
                          <th className="text-right p-2 font-medium">Amount</th>
                          <th className="text-right p-2 font-medium">Points</th>
                          <th className="text-left p-2 font-medium">Deleted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.data.bookings.recent.map((b) => (
                          <tr key={b.id} className={b.deleted_at ? 'bg-destructive/5' : ''}>
                            <td className="p-2 font-mono">{b.booking_reference || b.id.slice(0, 8)}</td>
                            <td className="p-2">
                              <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'cancelled' ? 'destructive' : 'outline'} className="text-[10px]">
                                {b.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">{b.currency} {b.total_price}</td>
                            <td className="p-2 text-right">{b.points_earned || 0} / -{b.points_used || 0}</td>
                            <td className="p-2">
                              {b.deleted_at ? (
                                <span className="text-destructive">Yes</span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </DiagnosticSection>

          {/* Loyalty & Points */}
          <DiagnosticSection
            title="Loyalty & Points"
            description="Points balance and transaction history"
            status={result.data.loyalty.loyaltyEnrolled ? 'ok' : 'info'}
          >
            <div className="space-y-4">
              <div className="divide-y">
                <DiagnosticRow
                  label="Loyalty Enrolled"
                  value={result.data.loyalty.loyaltyEnrolled ? 'Yes' : 'No'}
                  highlight={result.data.loyalty.loyaltyEnrolled ? 'success' : 'warning'}
                />
                <DiagnosticRow label="Points Balance" value={result.data.loyalty.pointsBalance.toLocaleString()} />
                <DiagnosticRow label="Lifetime Earned" value={result.data.loyalty.lifetimeEarned.toLocaleString()} />
                <DiagnosticRow label="Lifetime Spent" value={result.data.loyalty.lifetimeSpent.toLocaleString()} />
                <DiagnosticRow label="Referral Code" value={
                  result.data.loyalty.referralCode ? (
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.data.loyalty.referralCode}</code>
                  ) : 'None'
                } />
              </div>

              {result.data.loyalty.recentTransactions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Recent transactions:</p>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Type</th>
                          <th className="text-left p-2 font-medium">Source</th>
                          <th className="text-right p-2 font-medium">Points</th>
                          <th className="text-right p-2 font-medium">Balance After</th>
                          <th className="text-left p-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.data.loyalty.recentTransactions.map((t) => (
                          <tr key={t.id}>
                            <td className="p-2">
                              <Badge variant={t.transaction_type === 'earn' ? 'default' : 'secondary'} className="text-[10px]">
                                {t.transaction_type}
                              </Badge>
                            </td>
                            <td className="p-2">{t.source_type}</td>
                            <td className="p-2 text-right font-mono">
                              {t.points > 0 ? '+' : ''}{t.points}
                            </td>
                            <td className="p-2 text-right">{t.balance_after}</td>
                            <td className="p-2">{new Date(t.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </DiagnosticSection>

          {/* Referrals */}
          <DiagnosticSection
            title="Referrals"
            description="Referral invitations sent by this customer"
            status={result.data.referrals.total > 0 ? 'ok' : 'info'}
          >
            <div className="space-y-4">
              <div className="divide-y">
                <DiagnosticRow label="Total Referrals" value={result.data.referrals.total} />
                {Object.entries(result.data.referrals.byStatus).map(([status, count]) => (
                  <DiagnosticRow key={status} label={`Status: ${status}`} value={count} />
                ))}
              </div>

              {result.data.referrals.list.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Referral history:</p>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Referee Email</th>
                          <th className="text-left p-2 font-medium">Status</th>
                          <th className="text-left p-2 font-medium">Created</th>
                          <th className="text-right p-2 font-medium">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.data.referrals.list.map((r) => (
                          <tr key={r.id}>
                            <td className="p-2">{r.referee_email}</td>
                            <td className="p-2">
                              <Badge variant={r.status === 'completed' ? 'default' : 'outline'} className="text-[10px]">
                                {r.status}
                              </Badge>
                            </td>
                            <td className="p-2">{new Date(r.created_at).toLocaleDateString()}</td>
                            <td className="p-2 text-right">{r.referrer_booking_points || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </DiagnosticSection>

          {/* Notifications & Redemptions */}
          <div className="grid gap-4 md:grid-cols-2">
            <DiagnosticSection
              title="Notifications"
              status="info"
            >
              <div className="divide-y">
                <DiagnosticRow label="Total" value={result.data.notifications.total} />
                <DiagnosticRow label="Unread" value={result.data.notifications.unread} />
              </div>
            </DiagnosticSection>

            <DiagnosticSection
              title="Redemptions"
              status={result.data.redemptions.total > 0 ? 'ok' : 'info'}
            >
              <div className="divide-y">
                <DiagnosticRow label="Total" value={result.data.redemptions.total} />
                {Object.entries(result.data.redemptions.byStatus).map(([status, count]) => (
                  <DiagnosticRow key={status} label={status} value={count} />
                ))}
              </div>
            </DiagnosticSection>
          </div>
        </div>
      )}

      {!query && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Enter a customer email or name above to start diagnosing.</p>
        </div>
      )}
    </div>
  )
}
