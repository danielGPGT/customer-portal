import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect to custom login page with auth layout
  redirect('/login')
}
