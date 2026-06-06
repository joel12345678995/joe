import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, expires_at } = body;

    const cookieStore = cookies();

    if (access_token) {
      cookieStore.set({
        name: "sb-access-token",
        value: access_token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expires_at ? new Date(expires_at * 1000) : undefined,
      });
    }

    if (refresh_token) {
      cookieStore.set({
        name: "sb-refresh-token",
        value: refresh_token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
