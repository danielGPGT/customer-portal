import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-red-100 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The booking you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link href="/trips">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Trips
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

