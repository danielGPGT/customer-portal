import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChangePasswordForm } from '@/components/profile/change-password-form'

export default async function ChangePasswordPage() {
  const { client, user, error } = await getClient()

  if (!user) {
    redirect('/login')
  }

  if (error === 'no_client_access') {
    redirect('/dashboard?error=client_access_required')
  }

  if (!client) {
    redirect('/dashboard?error=client_not_found')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/profile" className="flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Change password</h1>
          <p className="text-muted-foreground">
            Update your password to keep your account secure. Make sure to use a strong, unique password.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Update password
          </CardTitle>
          <CardDescription>
            Enter your current password and choose a new one. Your new password must meet the security requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security tips</CardTitle>
          <CardDescription>Best practices for keeping your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Use a unique password</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Don't reuse passwords from other accounts. Each account should have its own strong password.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Change it regularly</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Update your password every few months, especially if you suspect any security issues.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



