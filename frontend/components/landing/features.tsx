'use client'

const FEATURES = [
  {
    icon: '📊',
    title: 'Audience Analytics',
    description: 'Deep insights into follower demographics, engagement patterns, and audience growth trends.',
  },
  {
    icon: '🎯',
    title: 'Influencer Discovery',
    description: 'Find perfectly matched influencers based on niche, audience size, and engagement rates.',
  },
  {
    icon: '💰',
    title: 'ROI Measurement',
    description: 'Track campaign performance and calculate exact return on investment for every collaboration.',
  },
  {
    icon: '🔍',
    title: 'Authenticity Check',
    description: 'Identify fake followers and bots to ensure authentic brand partnerships.',
  },
  {
    icon: '📈',
    title: 'Growth Tracking',
    description: 'Monitor influencer growth metrics and historical performance data over time.',
  },
  {
    icon: '🤝',
    title: 'Campaign Management',
    description: 'Manage multiple influencer campaigns with detailed collaboration and payment tracking.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative bg-background py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-foreground">Everything you need for</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary/50 bg-clip-text text-transparent">
              Influencer Marketing
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Comprehensive tools to discover, analyze, and collaborate with influencers that drive real results.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-8 transition hover:border-primary hover:shadow-lg"
            >
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
