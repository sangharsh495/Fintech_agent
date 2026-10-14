import { NextRequest, NextResponse } from "next/server";
import { safeLogError } from "@/server/lib/safe-log";
import { getSession } from "@/server/lib/get-session";
import { withUserScopedDb } from "@/server/db/rls-connection";
import { and, eq, inArray } from "drizzle-orm";
import { transactions, clusterMetadata, clusterRuns } from "@/server/db/schema";
import { runPythonClustering } from "@/server/ml-service/run-clustering";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

const CLUSTER_COLUMNS = {
  spending_behavior: "spendingCluster",
  transaction_size: "sizeCluster",
  temporal: "temporalCluster",
  category_affinity: "categoryCluster",
} as const;

/**
 * POST /api/analytics/run-clustering
 * Triggers transaction clustering for the authenticated user.
 * Returns clustering summary and stores results in the DB.
 */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  return withUserScopedDb(userId, async (db) => {
    try {
      // 1. Fetch all transactions for the user
      const txnRows = await db.select().from(transactions).where(eq(transactions.userId, userId));
      if (!txnRows.length) {
        return NextResponse.json({ error: "No transactions to cluster" }, { status: 400 });
      }

      // 2. Prepare input JSON for ML service
      const input = {
        transactions: txnRows.map((t) => ({
          id: t.id,
          date: t.date?.toISOString(),
          amount: Number(t.amount),
          category: t.category,
          payment_method: t.paymentMethod,
          description: t.description,
          merchant: t.merchant,
        })),
      };

      // A writable temp location (the app directory is read-only on
      // serverless hosts), always removed afterwards.
      const tmpPath = path.join(os.tmpdir(), `finflow-cluster-${randomUUID()}.json`);
      await fs.writeFile(tmpPath, JSON.stringify(input));

      // 3. Run clustering: Python when available, the rule-based JS fallback otherwise.
      let result;
      try {
        result = await runPythonClustering(userId, tmpPath, txnRows.length);
      } finally {
        await fs.rm(tmpPath, { force: true });
      }

      // 5. Update transactions with cluster IDs: one statement per cluster,
      // scoped to this user.
      for (const [clusterType, column] of Object.entries(CLUSTER_COLUMNS)) {
        const groups = (result.clusters as Record<string, Record<string, string[]>>)[clusterType] ?? {};
        for (const [clusterId, txnIds] of Object.entries(groups)) {
          if (!txnIds.length) continue;
          await db
            .update(transactions)
            .set({ [column]: Number(clusterId) })
            .where(and(eq(transactions.userId, userId), inArray(transactions.id, txnIds)));
        }
      }
      for (const anomaly of result.anomalies ?? []) {
        await db
          .update(transactions)
          .set({ isAnomaly: true, anomalyScore: anomaly.score })
          .where(and(eq(transactions.userId, userId), eq(transactions.id, anomaly.transaction_id)));
      }

      // 6. Store cluster metadata
      const metaRecords: any[] = [];
      const now = new Date();
      Object.entries(result.metadata ?? {})
        .filter(([k]) => ["spending_behavior", "transaction_size", "temporal", "category_affinity"].includes(k))
        .forEach(([clusterType, meta]) => {
          const metaObj = meta as Record<string, any>;
          Object.entries(metaObj).forEach(([clusterId, data]) => {
            metaRecords.push({
              userId,
              clusterType: clusterType,
              clusterId: Number(clusterId),
              label: data.label,
              description: data.description,
              color: data.color,
              centroid: JSON.stringify(data.centroid),
              transactionCount: data.transaction_count,
              totalAmount: data.total_amount,
              avgAmount: data.avg_amount,
              dominantCategory: data.dominant_category,
              dominantPaymentMethod: data.dominant_payment_method,
              percentageOfTotal: data.percentage_of_total,
              createdAt: now,
            });
          });
        });
      if (metaRecords.length > 0) {
        await db.insert(clusterMetadata).values(metaRecords);
      }

      // 7. Store run history
      await db.insert(clusterRuns).values({
        userId,
        clusterType: "combined",
        algorithm: result.algorithm ?? "kmeans",
        nClusters: result.n_clusters ?? 0,
        silhouetteScore: result.silhouette_score ?? null,
        inertia: result.inertia ?? null,
        totalTransactions: result.total_transactions ?? txnRows.length,
        parameters: JSON.stringify(result.parameters ?? {}),
        status: "completed",
        runAt: now,
      });

      return NextResponse.json({ success: true, message: "Clustering completed", result });
    } catch (error) {
      safeLogError("[CLUSTERING ERROR]", error);
      return NextResponse.json({ error: "Clustering failed" }, { status: 500 });
    }
  });
}
