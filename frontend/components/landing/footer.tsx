'use client'

import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Porchest"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-bold text-foreground">Porchest</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock influencer intelligence for smarter marketing decisions.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#features" className="transition hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="transition hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Porchest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
