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
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-primary via-primary to-primary p-5 text-white shadow-[0_15px_45px_rgba(92,46,248,0.35)]",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/40 blur-2xl" />
        <div className="absolute right-4 bottom-0 h-40 w-40 rounded-full bg-[#FDE68A]/50 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/75">
            Loyalty Referral Program
          </p>
          <h3 className="text-2xl font-bold leading-tight md:text-3xl">
            Share the love. Earn {bonusPoints} pts every time.
          </h3>
          <p className="text-white/85">
            Invite friends to book their next trip with your unique link and
            both of you unlock exclusive travel rewards.
          </p>
          <Button
            onClick={handleShare}
            disabled={!referralCode}
            className="mt-2 w-fit rounded-full bg-black/30 !px-6 !py-6 text-lg font-semibold text-white shadow-lg transition hover:bg-black/40 cursor-pointer"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Refer friends
          </Button>
        </div>
        <div className="flex items-center justify-center md:justify-end">
          <div className="relative flex h-32 w-40 items-center justify-center md:h-36 md:w-48">
            <div className="absolute inset-0 rounded-2xl bg-white/10 blur-md" />
            <UndrawMakeItRain
              height="100%"
              primaryColor="#FDE68A"
              accentColor="#F8B4D9"
              hairColor="#F9FAFB"
              skinColor="#FCD9B8"
              className="relative z-10 w-full max-w-[220px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

