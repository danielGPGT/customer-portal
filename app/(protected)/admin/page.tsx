import Link from "next/link"
import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { ClipboardList, Gift, LifeBuoy, ShieldCheck, Users } from "lucide-react"

type CountResult = number | null

async function getCount(query: any): Promise<CountResult> {
  try {
    const { count, error } = await query.select("*", { count: "exact", head: true })
    if (error) {
      console.warn("[Admin Page] Count error:", error.message)
      return null
    }
    return count ?? null
  } catch (error) {
    console.warn("[Admin Page] Count error:", error)
    return null
  }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id, name, role, status, team_id, email")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!teamMember || teamMember.status === "inactive") {
    redirect("/dashboard")
  }

  const [clientCount, referralCount, bookingCount] = await Promise.all([
    getCount(supabase.from("clients")),
    getCount(supabase.from("referrals")),
    getCount(supabase.from("bookings")),
  ])

  const quickStats = [
    {
      label: "Clients in Team",
      value: clientCount ?? "—",
      helper: "Total records linked to your team",
      icon: Users,
    },
    {
      label: "Owned Referrals",
      value: referralCount ?? "—",
      helper: "Referrals associated with your accounts",
      icon: Gift,
    },
    {
      label: "Active Bookings",
      value: bookingCount ?? "—",
      helper: "Bookings tied to your team",
      icon: ClipboardList,
    },
  ]

  const adminLinks = [
    {
      title: "Security & Auth Checklist",
      description: "Review RLS, password reset, and verification tasks.",
      path: "APPLICATION_REVIEW.md",
    },
    {
      title: "Database Schema Reference",
      description: "Inspect tables, relationships, and loyalty functions.",
      path: "db/db_schema.sql",
    },
    {
      title: "Project To‑Do Tracker",
      description: "Track open items across phases 1–12.",
      path: "to_do_list.md",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground">Admin Control Center</p>
        <h1 className="text-3xl font-bold">Welcome back, {teamMember.name || user.email}</h1>
        <p className="text-sm text-muted-foreground">
          Role: {teamMember.role || "team member"} · Team ID: {teamMember.team_id}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Critical Admin Actions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use these shortcuts to keep the portal secure and aligned with the rollout plan.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {adminLinks.map((link) => (
            <div key={link.title} className="rounded-lg bg-muted/20 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sm">{link.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
              </div>
              <div className="rounded-md bg-background px-3 py-2 text-xs font-mono text-muted-foreground border">
                {link.path}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Open this file in the repo or docs viewer to review the latest guidance.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LifeBuoy className="h-4 w-4" />
            Support Playbook
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Quick reminders when assisting customers or other team members.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• Always verify whether a login request is from a client or a fellow team member before linking records.</p>
          <p>• Use the referral hub to generate shareable links when helping VIP customers.</p>
          <p>• Reference the database schema when debugging loyalty transactions or bookings.</p>
        </CardContent>
      </Card>
    </div>
  )
}

