"use client"

import { WelcomeHero } from "@/components/admin/welcome-hero"
import { StatCard } from "@/components/admin/stat-card"
import { RecentProjects } from "@/components/admin/recent-projects"
import { ActivityFeed } from "@/components/admin/activity-feed"
import { OverviewChart } from "@/components/admin/overview-chart"
import { BarChart2, DollarSign, Users, CheckCircle2 } from "lucide-react"

export default function DashboardPage() {
  return (
    <>
      <WelcomeHero />

      {/* Stats */}
      <section>
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6">Global Performance</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatCard label="Projects" value="284" change={12.4} icon={BarChart2} description="Active & completed" />
          <StatCard label="Revenue" value="$38k" change={8.1} icon={DollarSign} description="This month" />
          <StatCard label="Members" value="1,204" change={-3.2} icon={Users} description="Across all orgs" />
          <StatCard label="On-time" value="99.1%" change={0.6} icon={CheckCircle2} description="Delivery rate" />
        </div>
      </section>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 gap-6">
        <OverviewChart />
      </div>

      {/* Bottom row */}
      <section>
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6">Operational Logistics</h2>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 pb-16 items-start">
          <RecentProjects />
          <ActivityFeed />
        </div>
      </section>
    </>
  )
}
