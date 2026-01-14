"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

export function AuthNavbar() {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src="/assets/images/gpgt-logo-light.png"
          alt="Grand Prix Grand Tours"
          width={200}
          height={60}
          className="h-8 w-auto"
          priority
          quality={100}
          unoptimized
        />
      </Link>

    </div>
  )
}
