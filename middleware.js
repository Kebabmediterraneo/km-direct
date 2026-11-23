import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { FONT_COOKIE, FONT_MAX_AGE_S } from "./lib/cookie-consent";

// ⚠️ Le pagine E le rotte API dello staff: qui passano dal controllo della
// sessione. (Non è `isStaffPath` di lib/cookie-consent, che guarda solo le pagine.)
function isPercorsoStaff(pathname) {
  return (
    pathname === "/staff" ||
    pathname.startsWith("/staff/") ||
    pathname === "/api/staff" ||
    pathname.startsWith("/api/staff/")
  );
}

// §66: nessuna pagina o API sotto /staff deve essere raggiungibile senza
// una sessione Supabase valida — controllo server-side, non un semplice
// nascondere elementi via JavaScript.
export async function middleware(request) {
  // §65b (decisioni 16a e 20, 23/11/2026) — PAGINE CLIENTE: nessuna chiamata a
  // Supabase. Se il cliente si è opposto ad Adobe Fonts, la risposta riscrive
  // dal server `km_font_off=1` per altri 400 giorni: l'opposizione dura finché
  // il cliente non la cambia o pulisce il browser. Chi non si è opposto non
  // riceve nessun cookie. Il middleware non crea e non toglie mai l'opposizione.
  if (!isPercorsoStaff(request.nextUrl.pathname)) {
    const response = NextResponse.next({ request });
    if (request.cookies.get(FONT_COOKIE)?.value === "1") {
      response.cookies.set(FONT_COOKIE, "1", {
        maxAge: FONT_MAX_AGE_S,
        path: "/",
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      });
    }
    return response;
  }

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
  // Le pagine cliente (solo per il rinnovo di km_font_off) e, come prima, lo staff.
  matcher: ["/", "/privacy", "/conferma", "/staff/:path*", "/api/staff/:path*"],
};
