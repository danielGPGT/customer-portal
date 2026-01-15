'use client'

import Image from 'next/image'

interface PageHeaderProps {
  title: string
  description?: string
  backgroundImage?: string
}

export function PageHeader({
  title,
  description,
  backgroundImage = '/assets/images/67b47522e00a9d3b8432bdd7_67b4739ca8ab15bb14dcff85_Singapore-Home-Tile-min.avif',
}: PageHeaderProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      {/* Background Image - Full Width */}
      <div className="relative w-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt="Travel background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={85}
          />
        </div>

        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Gradient Overlay - Top section (filled to transparent) */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
            background: 'var(--secondary-1000)',
          }}
        />
        
        {/* Gradient Overlay - Bottom section (transparent to filled) */}
        <div 
          className="absolute inset-0"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 50%, black 80%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 50%, black 80%, black 100%)',
            background: 'var(--secondary-1000)',
          }}
        />

        {/* Content - Title and Description */}
        <div className="relative flex flex-col px-4 md:px-16 py-6 sm:py-8 md:py-16 lg:py-16 justify-center mx-auto">
          <div className="max-w-2xl w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
              {title}
            </h1>
            {description && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed px-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
