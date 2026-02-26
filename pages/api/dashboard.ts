import type { NextApiRequest, NextApiResponse } from "next";
import { getDashboardData, DashboardData } from "@/lib/sheets";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData | { error: string; details?: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await getDashboardData();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (err: unknown) {
    console.error("Dashboard API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "Failed to fetch data", details: message });
  }
}
