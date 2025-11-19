"use client"

import * as React from "react"
import { UserPlus, Copy, Check, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface ReferAFriendWidgetProps {
  referralCode?: string
  referralLink?: string
  refereeBonus?: number
  referrerBonus?: number
  className?: string
}

export function ReferAFriendWidget({
  referralCode,
  referralLink,
  refereeBonus = 100,
  referrerBonus = 100,
  className,
}: ReferAFriendWidgetProps) {
  const [copied, setCopied] = React.useState(false)

  const displayLink = referralLink || (referralCode 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}` 
    : '')
  const displayCode = referralCode || 'N/A'

  const handleCopy = async (text: string) => {
    if (!text) return
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy",
        variant: "destructive",
      })
    }
  }

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
          text: `Sign up using my referral link and we both get ${refereeBonus} bonus points!`,
          url: displayLink,
        })
      } catch (err) {
        // User cancelled or error occurred, fall back to copy
        handleCopy(displayLink)
      }
    } else {
      handleCopy(displayLink)
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Refer a Friend</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">Give {refereeBonus}, Get {referrerBonus}</div>
            <div className="text-xs text-muted-foreground">Both you and your friend benefit!</div>
          </div>
        </div>

        {/* Referral Code Display */}
        {referralCode ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Your Referral Code</div>
            <div className="flex items-center gap-2">
              <Input
                value={displayCode}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(displayCode)}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">No referral code available</p>
          </div>
        )}

        {/* Share Button */}
        {displayLink && (
          <Button
            onClick={handleShare}
            className="w-full"
            variant="default"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Referral Link
          </Button>
        )}

        {/* How It Works Accordion */}
        <Accordion type="single" collapsible className="border-t pt-2">
          <AccordionItem value="how-it-works" className="border-none">
            <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
              How It Works
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Friend signs up using your link (+{refereeBonus} pts)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Friend makes their first booking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>You get {referrerBonus} bonus points!</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

