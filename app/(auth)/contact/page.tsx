import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Customer Loyalty Portal',
  description: 'Get in touch with our support team',
}

export default function ContactPage() {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">Contact Us</CardTitle>
        <CardDescription className="text-center">
          We're here to help with any questions or concerns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Send us an email and we'll get back to you as soon as possible.
              </p>
              <a 
                href="mailto:support@grandprixgrandtours.com" 
                className="text-primary hover:underline text-sm font-medium"
              >
                support@grandprixgrandtours.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Phone Support</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Call us during business hours for immediate assistance.
              </p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">UK:</span>{' '}
                  <a href="tel:+442034740512" className="text-primary hover:underline">
                    0203 474 0512
                  </a>
                </p>
                <p className="text-sm">
                  <span className="font-medium">US:</span>{' '}
                  <a href="tel:+12138086027" className="text-primary hover:underline">
                    213 808 6027
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Website</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Visit our main website for more information.
              </p>
              <a 
                href="https://www.grandprixgrandtours.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm font-medium"
              >
                www.grandprixgrandtours.com
              </a>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Business Hours</h3>
          <p className="text-sm text-muted-foreground">
            Monday - Friday: 9:00 AM - 6:00 PM GMT<br />
            Saturday: 10:00 AM - 4:00 PM GMT<br />
            Sunday: Closed
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


