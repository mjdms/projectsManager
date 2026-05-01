"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  FolderKanban,
  Layers,
  CalendarDays,
  BarChart2,
  Users,
  FileText,
  Bell,
  Settings,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  id: string
  href: string
  badge?: string
}

const main: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/" },
  { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects", badge: "12" },
  { id: "tasks", label: "Tasks", icon: Layers, href: "/tasks" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { id: "reports", label: "Reports", icon: BarChart2, href: "/reports" },
]

const workspace: NavItem[] = [
  { id: "team", label: "Team", icon: Users, href: "/team" },
  { id: "docs", label: "Documents", icon: FileText, href: "/docs" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications", badge: "3" },
]

function NavButton({
  item,
}: {
  item: NavItem
}) {
  const pathname = usePathname()
  const active = pathname === item.href
  const Icon = item.icon
  
  return (
    <Link
      href={item.href}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} strokeWidth={1.75} />
      <span className="truncate flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ onSearchClick }: { onSearchClick?: () => void }) {
  return (
    <aside className="flex w-full h-full flex-col px-3 pb-4 pt-6">
      {/* Search */}
      <div className="relative mb-5 group">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" strokeWidth={2} />
        <input
          type="text"
          placeholder="Search..."
          readOnly
          className="w-full h-9 pl-8 pr-12 rounded-md bg-secondary/50 border border-border text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
          onClick={onSearchClick}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-background text-[9px] font-bold text-muted-foreground">
          <span className="text-[10px] leading-none">⌘</span>K
        </div>
      </div>

      {/* Nav */}
      <nav className="custom-scrollbar flex-1 flex flex-col gap-5 overflow-y-auto">
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/40 uppercase">
            Main
          </div>
          <div className="flex flex-col gap-0.5">
            {main.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/40 uppercase">
            Workspace
          </div>
          <div className="flex flex-col gap-0.5">
            {workspace.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer / Settings */}
      <div className="flex flex-col gap-0.5 mt-auto">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate flex-1 text-left">Settings</span>
        </Link>
      </div>
    </aside>
  )
}
