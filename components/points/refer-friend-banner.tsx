"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { UndrawGift } from "react-undraw-illustrations"

interface ReferFriendBannerProps {
  referralCode?: string | null
  referralLink?: string | null
  bonusPoints?: number
  className?: string
}

const confettiSpecs = [
  { top: "5%", left: "10%", color: "#FDE047", rotate: "12deg" },
  { top: "15%", left: "65%", color: "#F472B6", rotate: "-25deg" },
  { top: "30%", left: "40%", color: "#34D399", rotate: "45deg" },
  { top: "45%", left: "80%", color: "#38BDF8", rotate: "18deg" },
  { top: "60%", left: "20%", color: "#F97316", rotate: "-12deg" },
  { top: "75%", left: "55%", color: "#FDE047", rotate: "30deg" },
  { top: "85%", left: "5%", color: "#F472B6", rotate: "-40deg" },
  { top: "10%", left: "85%", color: "#34D399", rotate: "8deg" },
  { top: "35%", left: "5%", color: "#38BDF8", rotate: "-18deg" },
  { top: "65%", left: "70%", color: "#F97316", rotate: "22deg" },
  { top: "50%", left: "50%", color: "#FDE047", rotate: "-30deg" },
  { top: "25%", left: "25%", color: "#F472B6", rotate: "36deg" },
  { top: "82%", left: "42%", color: "#34D399", rotate: "-6deg" },
  { top: "12%", left: "32%", color: "#38BDF8", rotate: "60deg" },
  { top: "58%", left: "90%", color: "#F97316", rotate: "-15deg" },
  { top: "90%", left: "78%", color: "#FDE047", rotate: "10deg" },
  { top: "70%", left: "35%", color: "#F472B6", rotate: "-28deg" },
  { top: "40%", left: "15%", color: "#34D399", rotate: "14deg" },
]

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
        "relative overflow-hidden md:!p-12 !p-6 rounded-3xl bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#DC2626] text-white shadow-md",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {confettiSpecs.map((spec, idx) => (
          <span
            key={idx}
            className="absolute block h-1.5 w-3 rounded-full"
            style={{
              backgroundColor: spec.color,
              top: spec.top,
              left: spec.left,
              transform: `rotate(${spec.rotate})`,
            }}
          />
        ))}
      </div>
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
            className="mt-2 w-fit rounded-full bg-black/30 backdrop-blur-sm !px-6 !py-6 text-lg font-semibold text-white shadow-lg transition hover:bg-black/40 cursor-pointer"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Refer friends
          </Button>
        </div>
        <div className="absolute md:right-6 -right-24 flex items-center justify-center -z-1 opacity-50">
          <div className="relative flex h-full w-full items-center justify-center overflow-visible">

            <div className="relative flex items-center justify-center">
            <div className="absolute w-[120%] aspect-square -z-1 rounded-full bg-black/20 "/>
            <div className="absolute w-[90%] aspect-square -z-1 rounded-full bg-black/20 "/>
            <UndrawGift
    
              primaryColor="#e00b0b"
              accentColor="#F8B4D9"
              shirtColor="#F9FAFB"
              hairColor="#F9FAFB"
              skinColor="#FCD9B8"
              className="relative z-10"
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

