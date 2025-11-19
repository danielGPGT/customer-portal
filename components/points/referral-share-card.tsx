"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, Copy, Check, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface ReferralShareCardProps {
  referralCode?: string | null
  referralLink?: string | null
  refereeBonus?: number
  referrerBonus?: number
}

export function ReferralShareCard({ 
  referralCode, 
  referralLink,
  refereeBonus = 100,
  referrerBonus = 100
}: ReferralShareCardProps) {
  const [copied, setCopied] = useState(false)

  const displayLink = referralLink || (referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}` : '')
  const displayCode = referralCode || 'N/A'
  const hasCode = !!referralCode

  const handleCopy = async (text: string) => {
    if (!text) return
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Copied to clipboard",
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span>Refer a Friend</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Share your code and earn {referrerBonus} points when they book
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex items-center gap-2">
            <Input
              value={displayCode}
              readOnly
              className="font-mono text-sm sm:text-lg font-semibold min-w-0 flex-1"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopy(displayCode)}
              disabled={!hasCode}
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

        {/* Share Link */}
        {displayLink && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Link</label>
            <div className="flex items-center gap-2">
              <Input
                value={displayLink}
                readOnly
                className="text-xs font-mono min-w-0 flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(displayLink)}
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
        )}

        {/* Share Button */}
        <Button
          onClick={handleShare}
          className="w-full"
          variant="default"
          disabled={!hasCode}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Link
        </Button>

        {!hasCode && (
          <p className="text-xs text-muted-foreground text-center">
            Create your first referral to get a code
          </p>
        )}

        {/* Info */}
        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p>• Friend gets {refereeBonus} points on signup</p>
          <p>• You get {referrerBonus} points when they book</p>
        </div>
      </CardContent>
    </Card>
  )
}

