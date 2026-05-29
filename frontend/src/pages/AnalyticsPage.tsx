import { BarChart3, TrendingUp, Package, Users, Download, Calendar, PieChart, Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useStats } from '@/hooks/useStats'
import { useAppTitle } from '@/hooks/useAppTitle'
import { useAnalyticsExport } from '@/hooks/useAnalyticsExport'
import { DateRangeSelector } from '@/components/analytics/DateRangeSelector'
import { LeaderboardCard } from '@/components/analytics/LeaderboardCard'
import { CarbonImpactCard } from '@/components/analytics/CarbonImpactCard'
import { WasteTypeChart } from '@/components/analytics/WasteTypeChart'
import { MonthlyTrendsChart } from '@/components/analytics/MonthlyTrendsChart'
import { RecyclingRateChart } from '@/components/analytics/RecyclingRateChart'
import { useState } from 'react'

export function AnalyticsPage() {
  useAppTitle('Analytics')
  const { totalWastes, isLoading } = useStats()
  const { exportToCSV, exportToPDF } = useAnalyticsExport()
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Track waste management trends and performance metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Total Waste Processed"
          value={Number(totalWastes)}
          trend="up"
          trendLabel="+12% from last month"
          isLoading={isLoading}
          variant="primary"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Active Participants"
          value={0}
          trend="up"
          trendLabel="+5 new this week"
          isLoading={isLoading}
          variant="success"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Recycling Rate"
          value="87%"
          trend="up"
          trendLabel="+3% improvement"
          isLoading={isLoading}
          variant="default"
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Avg Processing Time"
          value="2.4 days"
          trend="down"
          trendLabel="15% faster"
          isLoading={isLoading}
          variant="warning"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WasteTypeChart />
        <MonthlyTrendsChart />
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecyclingRateChart />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Plastic', value: 73, color: 'bg-blue-500' },
              { label: 'Metal', value: 51, color: 'bg-green-500' },
              { label: 'Glass', value: 42, color: 'bg-purple-500' },
              { label: 'Paper', value: 38, color: 'bg-orange-500' },
              { label: 'E-Waste', value: 22, color: 'bg-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium">{value}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard + Carbon */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeaderboardCard />
        <CarbonImpactCard />
      </div>
    </div>
  )
}
