"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { UndrawMakeItRain } from "react-undraw-illustrations"

interface ReferFriendBannerProps {
  referralCode?: string | null
  referralLink?: string | null
  bonusPoints?: number
  className?: string
}

export function ReferFriendBanner({
  referralCode,
  referralLink,
  bonusPoints = 300,
  className,
}: ReferFriendBannerProps) {
  const { toast } = useToast()

  const displayLink = referralLink || (referralCode 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}` 
    : '')

  const handleShare = async () => {
    if (!displayLink) {
      toast({
        title: "No referral code",
        description: "Please create a referral first",
        variant: "destructive",
      })
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me and earn bonus points!',
          text: `Sign up using my referral link and we both get ${bonusPoints} bonus points!`,
          url: displayLink,
        })
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(displayLink)
        toast({
          title: "Copied!",
          description: "Referral link copied to clipboard",
        })
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/90 dark:to-primary/80  p-4 md:p-6",
        className
      )}
    >
      <div className="relative h-full z-10 flex md:flex-row items-center md:items-center justify-between gap-6">
        {/* Left Side: Text and Button */}
        <div className="flex flex-col gap-4 flex-1 relative z-10">
          <div className="space-y-1 max-w-[250px]">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Refer a Friend
            </h3>
            <p className="text-xl md:text-xl font-semibold text-muted-foreground">
            Get {bonusPoints} points for each friend you refer!
            </p>
          </div>
          <Button
            onClick={handleShare}
            disabled={!referralCode}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2.5 w-fit shadow-lg hover:shadow-xl transition-all"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Refer friends
          </Button>
        </div>

        {/* Right Side: Illustration */}
        <div className="absolute right-0 w-full md:w-auto md:flex-shrink-0 flex items-center justify-end min-h-[200px]">
          <div className="w-full max-w-[250px] h-[200px] flex items-center justify-center">
            <UndrawMakeItRain
              primaryColor="#dd2727"
              height="100%"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

