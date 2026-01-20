import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Grand Prix Grand Tours Portal',
  description: 'Find answers to common questions about our loyalty program and services',
}

export default function FAQsPage() {
  const faqs = [
    {
      category: 'Loyalty Points',
      questions: [
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
          question: 'Can I transfer points to another account?',
          answer:
            'No, points are non-transferable and cannot be sold or exchanged for cash. Points are tied to your account and can only be used by you for discounts on your own bookings.',
        },
        {
          question: 'What if I notice incorrect points in my account?',
          answer:
            "If you notice any discrepancies with your points balance or transactions, please contact our support team immediately. We'll investigate and correct any errors. You can reach us at bookings@grandprixgrandtours.com or call us during business hours.",
        },
      ],
    },
    {
      category: 'Referrals',
      questions: [
        {
          question: 'How does the referral program work?',
          answer:
            "When you refer a friend using your unique referral code, they'll receive bonus points when they sign up. Once they complete their first booking, you'll also earn referral bonus points. You can find your referral code and link in the Referral Center section of your account.",
        },
        {
          question: 'How many people can I refer?',
          answer:
            'There is no limit to the number of people you can refer. Each successful referral earns you bonus points, so the more friends you refer, the more points you can earn!',
        },
        {
          question: 'When do I receive referral bonus points?',
          answer:
            'You will receive referral bonus points once your referred friend completes their first booking. The points will be automatically credited to your account.',
        },
      ],
    },
    {
      category: 'Account & Profile',
      questions: [
        {
          question: 'How do I update my profile information?',
          answer:
            'You can update your profile information, including name, email, phone number, and address, in the Profile & Settings section of your account. Some information may require verification before changes take effect.',
        },
        {
          question: 'What should I do if I forgot my password?',
          answer:
            "Click the 'Forgot password?' link on the login page. Enter your email address and we'll send you a password reset link. Make sure to check your spam folder if you don't receive the email within a few minutes.",
        },
        {
          question: 'How do I change my email address?',
          answer:
            'You can update your email address in the Profile & Settings section. We will send a verification email to your new address to confirm the change.',
        },
      ],
    },
    {
      category: 'Bookings & Trips',
      questions: [
        {
          question: 'Can I view my booking history?',
          answer:
            'Yes! All your past and upcoming trips are available in the Trips section of your account. You can view booking details, see points earned, and access important information about each trip.',
        },
        {
          question: 'How do I cancel or modify a booking?',
          answer:
            'To cancel or modify a booking, please contact our concierge team directly. You can reach us at bookings@grandprixgrandtours.com or call us during business hours. Please have your booking reference number ready.',
        },
        {
          question: 'When will I receive my booking confirmation?',
          answer:
            'You will receive a booking confirmation via email shortly after your booking is confirmed. This email will include all important details about your trip, including your booking reference number.',
        },
      ],
    },
    {
      category: 'Technical Support',
      questions: [
        {
          question: 'Is there a mobile app?',
          answer:
            "Currently, the loyalty portal is accessible through your web browser on any device. The portal is fully responsive and optimized for mobile, tablet, and desktop use. You can access all features from your phone's browser.",
        },
        {
          question: 'What browsers are supported?',
          answer:
            'The portal works best with modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for the best experience.',
        },
        {
          question: 'I\'m having trouble logging in. What should I do?',
          answer:
            'If you\'re having trouble logging in, first try resetting your password using the "Forgot password?" link. If the issue persists, please contact our support team at bookings@grandprixgrandtours.com for assistance.',
        },
      ],
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about our loyalty program and services"
      />

      <div className="space-y-6">
        {faqs.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="text-xl">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`${categoryIndex}-${index}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Still have questions? Our concierge team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/support">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Support
                </Link>
              </Button>
              <Button asChild>
                <a href="mailto:bookings@grandprixgrandtours.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Concierge
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
