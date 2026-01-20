import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Mail, Phone, Globe, Clock, HelpCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support & Contact | Grand Prix Grand Tours Portal',
  description: 'Get help from our concierge team or browse frequently asked questions',
}

export default function SupportPage() {
  const faqs = [
    {
      question: 'How do I earn loyalty points?',
      answer:
        'You earn points automatically when you make bookings with Grand Prix Grand Tours. Points are typically credited to your account after your booking is confirmed. The number of points earned depends on the value of your booking and current earning rates.',
    },
    {
      question: 'How can I redeem my points?',
      answer:
        "You can redeem points for discounts on future bookings. Simply select the amount of points you'd like to use during the booking process, and the discount will be applied automatically. You can use the redemption calculator in your account to see how much discount your points are worth.",
    },
    {
      question: 'Do my points expire?',
      answer:
        "Points may expire after a period of account inactivity. We'll notify you via email before any points are due to expire. You can check your points expiry dates in your account dashboard. To keep your points active, simply make a booking or log into your account periodically.",
    },
    {
      question: 'How does the referral program work?',
      answer:
        "When you refer a friend using your unique referral code, they'll receive bonus points when they sign up. Once they complete their first booking, you'll also earn referral bonus points. You can find your referral code and link in the Referral Center section of your account.",
    },
    {
      question: 'Can I transfer points to another account?',
      answer:
        'No, points are non-transferable and cannot be sold or exchanged for cash. Points are tied to your account and can only be used by you for discounts on your own bookings.',
    },
    {
      question: 'What if I notice incorrect points in my account?',
      answer:
        "If you notice any discrepancies with your points balance or transactions, please contact our support team immediately. We'll investigate and correct any errors. You can reach us at bookings@grandprixgrandtours.com or call us during business hours.",
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Support & Contact"
        description="Get help from our concierge team or find answers to common questions"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Concierge Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Contact Concierge</CardTitle>
                <CardDescription>Get personalized assistance from our team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-primary/10 p-2">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Send us an email and we'll get back to you as soon as possible.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <a href="mailto:bookings@grandprixgrandtours.com">
                      bookings@grandprixgrandtours.com
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-primary/10 p-2">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Call us during business hours for immediate assistance.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">UK:</span>{' '}
                      <Button asChild variant="link" size="sm" className="h-auto p-0">
                        <a href="tel:+442034740512" className="text-primary">
                          0203 474 0512
                        </a>
                      </Button>
                    </div>
                    <div>
                      <span className="text-sm font-medium">US:</span>{' '}
                      <Button asChild variant="link" size="sm" className="h-auto p-0">
                        <a href="tel:+12138086027" className="text-primary">
                          213 808 6027
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-primary/10 p-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Website</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Visit our main website for more information.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="https://www.grandprixgrandtours.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Website
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM GMT</p>

                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Need more help? Browse our complete FAQ section.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/support/faqs">View All FAQs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
