"use client"

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Tasks</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Stay on top of your daily to-dos.</p>
      </header>
      
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card px-5 py-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 rounded border border-border" />
              <span className="text-[13px] text-foreground font-medium">Complete the documentation for sprint {i}</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">Today</span>
          </div>
        ))}
      </div>
    </div>
  )
}
