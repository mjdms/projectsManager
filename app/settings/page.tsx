"use client"

import { User, Shield, CreditCard, Bell, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "workspace", label: "Workspace", icon: Globe },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Configure your personal preferences and workspace settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12">
        {/* Sub-nav */}
        <nav className="flex flex-col gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                s.id === "profile" 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Form Content Mock */}
        <div className="flex flex-col gap-8 max-w-xl">
          <div className="space-y-6">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground mb-4">Public Profile</h3>
              <div className="grid gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Display Name</label>
                  <input type="text" defaultValue="John Doe" className="h-9 px-3 rounded-md bg-background border border-border/40 text-[13px] focus:outline-none focus:border-primary/50 transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                  <input type="email" defaultValue="john@saas.app" className="h-9 px-3 rounded-md bg-background border border-border/40 text-[13px] focus:outline-none focus:border-primary/50 transition-colors" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/10">
              <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
