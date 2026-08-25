import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cuenta";

  // Sanitize origin: 0.0.0.0 is an invalid destination address in browsers
  const forwardedHost = request.headers.get("x-forwarded-host");
  let redirectBase = origin;
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    redirectBase = `${proto}://${forwardedHost}`;
  } else if (redirectBase.includes("0.0.0.0")) {
    redirectBase = redirectBase.replace("0.0.0.0", "localhost");
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  return NextResponse.redirect(`${redirectBase}/auth/auth-code-error`);
}

