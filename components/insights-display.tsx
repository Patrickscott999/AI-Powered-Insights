"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface InsightsDisplayProps {
  insights: string
  statistics: {
    numeric_columns: Record<string, any>
    categorical_columns: Record<string, any>
    correlations: Record<string, any>
  }
}

export function InsightsDisplay({ insights, statistics }: InsightsDisplayProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="whitespace-pre-wrap">{insights}</div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {Object.entries(statistics.numeric_columns).map(([column, stats]) => (
                <div key={column} className="space-y-2">
                  <h3 className="font-semibold">{column}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Mean: {stats.mean.toFixed(2)}</div>
                    <div>Median: {stats.median.toFixed(2)}</div>
                    <div>Std Dev: {stats.std.toFixed(2)}</div>
                    <div>Range: {stats.min.toFixed(2)} - {stats.max.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 