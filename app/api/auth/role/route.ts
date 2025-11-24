import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ isAuthenticated: false, isTeamMember: false })
  }

  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle()

  const isTeamMember = Boolean(teamMember && teamMember.status !== "inactive")

  return NextResponse.json({
    isAuthenticated: true,
    isTeamMember,
  })
}

