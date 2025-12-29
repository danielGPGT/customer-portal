import { redirect } from 'next/navigation'

// Redirect /dashboard to the main dashboard at /
export default function DashboardPage() {
  redirect('/')
}

