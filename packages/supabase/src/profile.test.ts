import { describe, expect, it } from "vitest";

import {
  normalizeProfileMetadata,
  sanitizeUserProfileInput,
} from "./profile";

describe("profile helpers", () => {
  it("normalizes user metadata into safe profile defaults", () => {
    expect(
      normalizeProfileMetadata({
        display_name: "  Kari Nordmann  ",
        phone: "12345678",
        job_title: "Daglig leder",
        preferred_locale: "en",
        theme_preference: "night",
        notification_preferences: {
          email: false,
          inApp: true,
          weeklySummary: false,
        },
      }),
    ).toEqual({
      displayName: "Kari Nordmann",
      phone: "12345678",
      jobTitle: "Daglig leder",
      preferredLocale: "en",
      themePreference: "night",
      notificationPreferences: {
        email: false,
        inApp: true,
        weeklySummary: false,
      },
    });
  });

  it("falls back gracefully when metadata is missing or invalid", () => {
    expect(
      normalizeProfileMetadata({
        display_name: 42,
        preferred_locale: "sv",
        theme_preference: "blue",
        notification_preferences: "invalid",
      }),
    ).toEqual({
      displayName: "",
      phone: "",
      jobTitle: "",
      preferredLocale: "no",
      themePreference: "system",
      notificationPreferences: {
        email: true,
        inApp: true,
        weeklySummary: false,
      },
    });
  });

  it("sanitizes submitted profile input", () => {
    expect(
      sanitizeUserProfileInput({
        displayName: "  Ola Nordmann  ",
        phone: " +47 123 45 678 ",
        jobTitle: "  Prosjektleder ",
        preferredLocale: "en",
        themePreference: "dark",
        notifyEmail: "on",
        notifyInApp: "off",
        notifyWeeklySummary: "on",
      }),
    ).toEqual({
      displayName: "Ola Nordmann",
      phone: "+47 123 45 678",
      jobTitle: "Prosjektleder",
      preferredLocale: "en",
      themePreference: "dark",
      notificationPreferences: {
        email: true,
        inApp: false,
        weeklySummary: true,
      },
    });
  });
});
