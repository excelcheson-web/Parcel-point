'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

// Logistics background images for the slideshow
const backgroundImages = [
  {
    src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80',
    alt: 'Modern warehouse logistics facility with organized cargo',
  },
  {
    src: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1920&q=80',
    alt: 'Busy shipping port with cargo containers and cranes',
  },
  {
    src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80',
    alt: 'Airplane at airport cargo terminal for air freight',
  },
]

export default function BackgroundSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length)
    }, 6000) // Change slide every 6 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-slideshow">
      {/* Background Images */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`bg-slideshow-slide ${index === currentSlide ? 'active' : ''}`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
            quality={80}
          />
        </div>
      ))}

      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

      {/* Additional gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071427]/60 via-transparent to-[#071427]/40" />
    </div>
  )
}
