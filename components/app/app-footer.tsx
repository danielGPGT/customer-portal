import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, ArrowUpRight } from 'lucide-react'

const footerLinks = [
  {
    title: 'Trips',
    links: [
      { label: 'Upcoming', href: '/trips?tab=upcoming' },
      { label: 'Past', href: '/trips?tab=past' },
      { label: 'Cancelled', href: '/trips?tab=cancelled' },
    ],
  },
  {
    title: 'Loyalty',
    links: [
      { label: 'Points overview', href: '/points' },
      { label: 'How to earn', href: '/points/earn' },
      { label: 'How to redeem', href: '/points/redeem' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact concierge', href: '/support' },
      { label: 'FAQs', href: '/support/faqs' },
      { label: 'Refer a friend', href: '/refer' },
    ],
  },
]

const contactItems = [
  { icon: Mail, label: 'bookings@grandprixgrandtours.com' },
]

export function AppFooter() {
  return (
    <footer className="border-t bg-card w-full backdrop-blur">
      <div className="mx-auto w-full container px-4 py-12 lg:px-0">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="relative h-10 w-48">
              <Image
                src="/assets/images/gpgt-logo-light.png"
                alt="Grand Prix Grand Tours"
                fill
                className="object-contain dark:hidden"
                priority
                sizes="192px"
              />
              <Image
                src="/assets/images/gpgt-logo.png"
                alt="Grand Prix Grand Tours"
                fill
                className="hidden object-contain dark:block"
                priority
                sizes="192px"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Plan every race weekend, track your points, and enjoy concierge-level support from
              anywhere in the world.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              {contactItems.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-full border px-3 py-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      prefetch={true}
                      className="inline-flex items-center gap-1 font-medium text-muted-foreground transition hover:text-primary"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Grand Prix Grand Tours. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" prefetch={true} className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" prefetch={true} className="hover:text-primary">
              Terms
            </Link>
            <Link href="/accessibility" prefetch={true} className="hover:text-primary">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

