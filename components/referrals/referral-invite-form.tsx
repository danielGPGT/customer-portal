"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "@/hooks/use-toast"
import { submitReferralInvite } from "@/app/(protected)/refer/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

const initialState = {
  success: false,
  error: undefined as string | undefined,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button disabled={pending} className="w-full md:w-auto">
      {pending ? "Sending..." : "Send invite"}
    </Button>
  )
}

export function ReferralInviteForm() {
  const [state, formAction] = useActionState(submitReferralInvite, initialState)

  React.useEffect(() => {
    if (state?.success) {
      toast({
        title: "Invite sent",
        description: "Your friend will receive an email with the referral link.",
      })
    } else if (state?.error) {
      toast({
        title: "Unable to send invite",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <UserPlus className="h-4 w-4 text-primary" />
          <span>Invite a friend via email</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral-email">Friend&apos;s email</Label>
            <Input
              id="referral-email"
              name="email"
              type="email"
              placeholder="friend@example.com"
              autoComplete="off"
              required
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll send them your referral link with the welcome bonus details.
            </p>
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}

