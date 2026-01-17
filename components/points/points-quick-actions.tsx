"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Plane, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function PointsQuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-base font-medium">
              Refer a friend for 100 points
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/refer" prefetch={true} className="flex items-center justify-between">
                <span>Start Referring</span>
                <UserPlus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-base font-medium">
              View your trip history
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/trips" prefetch={true} className="flex items-center justify-between">
                <span>My Trips</span>
                <Plane className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

