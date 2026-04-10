import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { handleAppSession } from "./middleware";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

describe("handleAppSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
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
});
