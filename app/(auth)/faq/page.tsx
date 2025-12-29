import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Customer Loyalty Portal',
  description: 'Common questions about the loyalty program',
}

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I earn loyalty points?",
      answer: "You earn points automatically when you make bookings with Grand Prix Grand Tours. Points are typically credited to your account after your booking is confirmed. The number of points earned depends on the value of your booking and current earning rates."
    },
    {
      question: "How can I redeem my points?",
      answer: "You can redeem points for discounts on future bookings. Simply select the amount of points you'd like to use during the booking process, and the discount will be applied automatically. You can use the redemption calculator in your account to see how much discount your points are worth."
    },
    {
      question: "Do my points expire?",
      answer: "Points may expire after a period of account inactivity. We'll notify you via email before any points are due to expire. You can check your points expiry dates in your account dashboard. To keep your points active, simply make a booking or log into your account periodically."
    },
    {
      question: "How does the referral program work?",
      answer: "When you refer a friend using your unique referral code, they'll receive bonus points when they sign up. Once they complete their first booking, you'll also earn referral bonus points. You can find your referral code and link in the Referral Center section of your account."
    },
    {
      question: "Can I transfer points to another account?",
      answer: "No, points are non-transferable and cannot be sold or exchanged for cash. Points are tied to your account and can only be used by you for discounts on your own bookings."
    },
    {
      question: "What if I notice incorrect points in my account?",
      answer: "If you notice any discrepancies with your points balance or transactions, please contact our support team immediately. We'll investigate and correct any errors. You can reach us at support@grandprixgrandtours.com or call us during business hours."
    },
    {
      question: "How do I update my profile information?",
      answer: "You can update your profile information, including name, email, phone number, and address, in the Profile & Settings section of your account. Some information may require verification before changes take effect."
    },
    {
      question: "Can I view my booking history?",
      answer: "Yes! All your past and upcoming trips are available in the Trips section of your account. You can view booking details, see points earned, and access important information about each trip."
    },
    {
      question: "What should I do if I forgot my password?",
      answer: "Click the 'Forgot password?' link on the login page. Enter your email address and we'll send you a password reset link. Make sure to check your spam folder if you don't receive the email within a few minutes."
    },
    {
      question: "Is there a mobile app?",
      answer: "Currently, the loyalty portal is accessible through your web browser on any device. The portal is fully responsive and optimized for mobile, tablet, and desktop use. You can access all features from your phone's browser."
    }
  ]

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">Frequently Asked Questions</CardTitle>
        <CardDescription className="text-center">
          Find answers to common questions about our loyalty program
        </CardDescription>
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
          <p className="text-sm text-muted-foreground text-center">
            Still have questions?{' '}
            <a href="/contact" className="text-primary hover:underline font-medium">
              Contact our support team
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
