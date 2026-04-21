'use client'

const STEPS = [
  {
    number: '01',
    title: 'Define Your Goals',
    description: 'Specify your campaign objectives, budget, and target audience demographics.',
  },
  {
    number: '02',
    title: 'Discover Influencers',
    description: 'Browse our database of 10,000+ verified influencers filtered by niche and metrics.',
  },
  {
    number: '03',
    title: 'Analyze Performance',
    description: 'Review detailed analytics on audience quality, engagement rates, and past collaborations.',
  },
  {
    number: '04',
    title: 'Launch Campaign',
    description: 'Collaborate with influencers and track real-time campaign performance and ROI.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-background py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Get started with influencer marketing in four simple steps.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={index} className="relative">
              <div className="mb-4">
                <div className="text-5xl font-bold text-primary opacity-20">{step.number}</div>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
              
              {index < STEPS.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-1 w-12 bg-gradient-to-r from-primary to-transparent lg:block"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
