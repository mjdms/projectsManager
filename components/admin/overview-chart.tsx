import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { date: "Apr 01", value: 400 },
  { date: "Apr 05", value: 300 },
  { date: "Apr 10", value: 500 },
  { date: "Apr 15", value: 450 },
  { date: "Apr 20", value: 600 },
  { date: "Apr 25", value: 550 },
  { date: "Apr 30", value: 800 },
]

export function OverviewChart() {
  return (
    <section className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">Revenue Overview</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Net revenue for the last 30 days</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">$38,240</div>
          <div className="text-[11px] text-success font-medium">+12.4%</div>
        </div>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="date" 
              hide 
            />
            <YAxis 
              hide 
              domain={['dataMin - 100', 'dataMax + 100']} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-md border border-border bg-card px-2 py-1 shadow-none">
                      <p className="text-[10px] font-medium text-foreground">
                        {payload[0].value}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "var(--primary)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Revenue</span>
          </div>
        </div>
        <button className="text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/40 px-2.5 py-1.5 rounded-md transition-colors font-medium">
          View full report
        </button>
      </div>
    </section>
  )
}
