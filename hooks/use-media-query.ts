import * as React from "react"

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    if (media.addEventListener) {
      media.addEventListener("change", handler)
    } else {
      // Fallback for older browsers
      media.addListener(handler)
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handler)
      } else {
        // Fallback for older browsers
        media.removeListener(handler)
      }
    }
  }, [query])

  return matches
}

