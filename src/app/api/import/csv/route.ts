import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rows = body?.rows ?? [];
  const mapped = rows.map((row: Record<string, string>) => ({
    name: row.name,
    phone: row.phone,
    total_saved: Number(row.total_saved || 0),
    contributions_paid: Number(row.contributions_paid || 0),
    loans_balance: Number(row.loans_balance || 0),
  }));
  return NextResponse.json({ imported: mapped.length, data: mapped });
}
