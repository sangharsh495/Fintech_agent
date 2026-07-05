"use client"

import ClusterAnalytics from "@/components/cluster-analytics"

export default function ClusterPage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Cluster Analytics</h1>
          <p className="text-muted-foreground mt-1">
            ML-powered transaction clustering with K-Means and DBSCAN
          </p>
        </div>
        <ClusterAnalytics />
      </div>
    </div>
  )
}
