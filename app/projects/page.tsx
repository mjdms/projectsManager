"use client"

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Projects</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Manage and track your ongoing initiatives.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-6 rounded-xl">
            <div className="h-2 w-12 bg-primary/20 rounded-full mb-4" />
            <h3 className="font-semibold text-foreground">Project Alpha {i}</h3>
            <p className="text-[12px] text-muted-foreground mt-2">A placeholder project for the new structured layout.</p>
          </div>
        ))}
      </div>
    </div>
  )
}
