"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { CountUp } from "@/components/ui/count-up"

export function WelcomeHero() {
  const [date, setDate] = useState<string>("")

  useEffect(() => {
    const now = new Date()
    setDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }))
  }, [])

  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-border/20">
      <div className="flex-1">
        {date ? (
          <p className="text-[11px] font-bold text-primary/60 uppercase tracking-[0.2em] mb-2 leading-5">{date}</p>
        ) : (
          <Skeleton className="h-5 w-32 mb-2" />
        )}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Good morning, Alex
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground font-medium">
          You have <span className="text-foreground"><CountUp end={12} duration={800} /> active projects</span> and reached <span className="text-success font-semibold"><CountUp end={84} duration={1000} suffix="%" /></span> of your weekly goals.
        </p>
      </div>
    </header>
  )
}
