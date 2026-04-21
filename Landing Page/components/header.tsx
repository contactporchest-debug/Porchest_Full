'use client'

import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Porchest"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="hidden font-bold text-xl sm:inline text-foreground">Porchest</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Contact
            </button>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button className="hidden rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted sm:inline-flex">
              Sign In
            </button>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
