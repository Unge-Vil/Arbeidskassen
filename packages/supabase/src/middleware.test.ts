import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { CONSOLIDATED_AUTH_POLICY, handleAppSession } from "./middleware";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

describe("handleAppSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("refreshes auth cookies without mutating the immutable request cookie store", async () => {
    vi.mocked(createServerClient).mockImplementation((...args) => {
      const cookieStore = args[2]?.cookies;

      return {
        auth: {
          getUser: vi.fn(async () => {
            cookieStore?.setAll([
              {
                name: "sb-access-token",
                value: "fresh-token",
                options: { path: "/", httpOnly: true },
              },
            ]);

            return {
              data: {
                user: {
                  id: "user-1",
                },
              },
            };
          }),
        },
      } as never;
    });

    const request = new NextRequest("https://example.com/dashboard");
    const requestCookieSet = vi
      .spyOn(request.cookies, "set")
      .mockImplementation(() => {
        throw new Error("request cookies are immutable in middleware");
      });

    const intlResponse = NextResponse.next({ request });
    intlResponse.headers.set("x-intl-locale", "no");

    const response = await handleAppSession(
      request,
      {
        protectedPrefixes: ["/dashboard"],
      },
      intlResponse,
    );

    expect(requestCookieSet).not.toHaveBeenCalled();
    expect(response.headers.get("x-intl-locale")).toBe("no");
    expect(response.cookies.get("sb-access-token")?.value).toBe("fresh-token");
  });

  it("accepts the Vercel/Supabase publishable key env name when anon key is absent", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "sb_publishable_test_key";

    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: null,
          },
        })),
      },
    } as never);

    const request = new NextRequest("https://example.com/");
    const response = await handleAppSession(
      request,
      { protectedPrefixes: ["/dashboard"] },
      NextResponse.next({ request }),
    );

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test_key",
      expect.any(Object),
    );
    expect(response.status).toBe(200);
  });

  it("redirects protected routes to root login with a returnTo query", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: null,
          },
        })),
      },
    } as never);

    const request = new NextRequest("https://example.com/no/dashboard?tab=overview");
    const response = await handleAppSession(
      request,
      { loginPath: "/login", protectedPrefixes: ["/no/dashboard"] },
      NextResponse.next({ request }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/login?returnTo=%2Fno%2Fdashboard%3Ftab%3Doverview",
    );
  });

  it("prefers a safe returnTo target when an authenticated user visits login", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: {
              id: "user-1",
            },
          },
        })),
      },
    } as never);

    const request = new NextRequest("https://example.com/login?returnTo=%2Fno%2Fbookdet%2Foversikt");
    const response = await handleAppSession(
      request,
      { loginPath: "/login", postLoginPath: "/no/select-tenant" },
      NextResponse.next({ request }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/no/bookdet/oversikt");
  });

  it("keeps public routes available when Supabase env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const request = new NextRequest("https://example.com/");
    const response = await handleAppSession(
      request,
      { protectedPrefixes: ["/dashboard"] },
      NextResponse.next({ request }),
    );

    expect(createServerClient).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});

describe("CONSOLIDATED_AUTH_POLICY", () => {
  it("protects all module prefixes in the single-app architecture", () => {
    expect(CONSOLIDATED_AUTH_POLICY.loginPath).toBe("/login");
    expect(CONSOLIDATED_AUTH_POLICY.postLoginPath).toBe("/select-tenant");
    expect(CONSOLIDATED_AUTH_POLICY.protectedPrefixes).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/select-tenant",
        "/profil",
        "/bookdet",
        "/organisasjon",
        "/teamarea",
        "/today",
        "/backoffice",
        "/sales-portal",
      ]),
    );
  });
});


