import { NextRequest, NextResponse } from "next/server";
import { safeLogError } from "@/server/lib/safe-log";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { transactions, clusterMetadata, clusterRuns } from "@/server/db/schema";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";

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

    const tmpPath = join(process.cwd(), `cluster_input_${userId}.json`);
    writeFileSync(tmpPath, JSON.stringify(input));

    // 3. Execute the ML service script
    const cmd = `python3 ${join(process.cwd(), "ml-service/app/main.py")} --file ${tmpPath} --userId ${userId}`;
    const rawOutput = execSync(cmd, { encoding: "utf-8" });
    // Clean up temp file
    unlinkSync(tmpPath);

    // 4. Parse ML output (expects JSON)
    const result = JSON.parse(rawOutput);

    // 5. Update transactions with cluster IDs
    const txnUpdates: Promise<any>[] = [];
    Object.entries(result.clusters ?? {}).forEach(([clusterType, clusters]) => {
      // clusterType corresponds to keys used in DB columns (e.g., spending_behavior => spendingCluster)
      const dbColumn = (() => {
        switch (clusterType) {
          case "spending_behavior":
            return "spendingCluster" as const;
          case "transaction_size":
            return "sizeCluster" as const;
          case "temporal":
            return "temporalCluster" as const;
          case "category_affinity":
            return "categoryCluster" as const;
          default:
            return null;
        }
      })();
      if (!dbColumn) return;
      Object.entries(clusters as Record<string, string[]>).forEach(([clusterId, txnIds]) => {
        txnIds.forEach((txnId) => {
          txnUpdates.push(
            db
              .update(transactions)
              .set({ [dbColumn]: Number(clusterId) })
              .where(eq(transactions.id, txnId))
          );
        });
      });
    });
    await Promise.all(txnUpdates);

    // 6. Store cluster metadata
    const metaInserts: Promise<any>[] = [];
    const now = new Date();
    Object.entries(result.metadata ?? {})
      .filter(([k]) => ["spending_behavior", "transaction_size", "temporal", "category_affinity"].includes(k))
      .forEach(([clusterType, meta]) => {
        const metaObj = meta as Record<string, any>;
        Object.entries(metaObj).forEach(([clusterId, data]) => {
          metaInserts.push(
            db.insert(clusterMetadata).values({
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
            })
          );
        });
      });
    await Promise.all(metaInserts);

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
}
