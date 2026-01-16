import { redirect } from 'next/navigation'

interface SignUpPageProps {
  searchParams: Promise<{ ref?: string }>
}

export default async function Page({ searchParams }: SignUpPageProps) {
  const params = await searchParams
  const referralCode = params.ref || null

  // Redirect to custom signup page with auth layout
  // Preserve referral code in URL
  const signupUrl = referralCode ? `/signup?ref=${encodeURIComponent(referralCode)}` : '/signup'
  redirect(signupUrl)
}
