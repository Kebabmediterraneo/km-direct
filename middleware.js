import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// §66: nessuna pagina o API sotto /staff deve essere raggiungibile senza
// una sessione Supabase valida — controllo server-side, non un semplice
// nascondere elementi via JavaScript.
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/staff/login";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/staff");

  if (!user && !isLoginPage) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/staff/:path*", "/api/staff/:path*"],
};
