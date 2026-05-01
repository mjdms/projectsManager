import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      {/* Welcome Hero Skeleton */}
      <div className="flex flex-col gap-4 pb-10 border-b border-border/20">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-6 h-[350px]">
            <div className="flex justify-between mb-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-6 w-20 ml-auto" />
                <Skeleton className="h-4 w-12 ml-auto" />
              </div>
            </div>
            <Skeleton className="w-full h-[200px]" />
          </div>
        </div>
        <div>
          <div className="glass-card rounded-xl p-6 h-[350px]">
             <Skeleton className="h-5 w-24 mb-6" />
             <div className="space-y-6">
               {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex gap-4">
                   <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                   <div className="space-y-2 flex-1">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-3 w-2/3" />
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
