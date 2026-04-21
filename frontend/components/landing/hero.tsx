'use client'

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background pt-20">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-foreground">Unlock Influencer</span>
          <br />
          <span className="bg-gradient-to-r from-primary to-secondary/50 bg-clip-text text-transparent">
            Intelligence
          </span>
        </h1>

        <p className="mb-8 text-xl text-muted-foreground sm:text-2xl">
          Discover authentic influencers, analyze audience demographics, and measure campaign ROI with precision.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
          <a
            href="https://wa.me/YOUR_WHATSAPP_NUMBER"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90 hover:shadow-lg"
          >
            Chat on WhatsApp
          </a>
          <a
            href="mailto:info@porchest.com"
            className="rounded-lg border border-primary/50 px-8 py-4 font-semibold text-foreground transition hover:bg-primary/10"
          >
            Send Email
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-12">
          <div>
            <div className="text-3xl font-bold text-primary">10K+</div>
            <p className="mt-2 text-sm text-muted-foreground">Influencers Tracked</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">50M+</div>
            <p className="mt-2 text-sm text-muted-foreground">Audience Analyzed</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">95%</div>
            <p className="mt-2 text-sm text-muted-foreground">Accuracy Rate</p>
          </div>
        </div>
      </div>
    </section>
  )
}
