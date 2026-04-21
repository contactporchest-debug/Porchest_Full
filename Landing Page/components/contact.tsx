'use client'

export function Contact() {
  return (
    <section id="contact" className="relative bg-background py-20 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to Start?
            </h2>
            <p className="text-lg text-muted-foreground">
              Get in touch with our team to discuss your influencer marketing goals.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* WhatsApp Contact */}
            <a
              href="https://wa.me/YOUR_WHATSAPP_NUMBER"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center rounded-xl border border-border bg-background p-8 transition hover:border-primary hover:bg-primary/5"
            >
              <div className="mb-4 text-5xl">💬</div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Chat on WhatsApp</h3>
              <p className="text-center text-muted-foreground">
                Quick response guaranteed
              </p>
              <div className="mt-4 font-semibold text-primary group-hover:underline">
                Open WhatsApp →
              </div>
            </a>

            {/* Email Contact */}
            <a
              href="mailto:info@porchest.com"
              className="group flex flex-col items-center justify-center rounded-xl border border-border bg-background p-8 transition hover:border-primary hover:bg-primary/5"
            >
              <div className="mb-4 text-5xl">✉️</div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Send Email</h3>
              <p className="text-center text-muted-foreground">
                info@porchest.com
              </p>
              <div className="mt-4 font-semibold text-primary group-hover:underline">
                Send Email →
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
