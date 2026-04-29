import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_STORAGE_KEY = "oa-cookie-consent-v1";

type CookieConsentChoice = "accepted" | "declined";

type StoredCookieConsent = {
  choice: CookieConsentChoice;
  savedAt: string;
};

function readStoredConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (
      parsed &&
      (parsed.choice === "accepted" || parsed.choice === "declined") &&
      typeof parsed.savedAt === "string"
    ) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  }

  return null;
}

function saveConsent(choice: CookieConsentChoice) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredCookieConsent = {
    choice,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify(payload)
  );
}

export const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!readStoredConsent());
  }, []);

  const handleChoice = (choice: CookieConsentChoice) => {
    saveConsent(choice);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-app-border bg-app-panel/95 p-4 shadow-lg shadow-app-border backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-app-text">Cookie Preferences</p>
            <p className="max-w-2xl text-sm leading-relaxed text-app-muted">
              We use cookies and similar storage to keep you signed in, remember
              your preferences, and improve the site experience. Your choice is
              saved on this device.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleChoice("declined")}
            >
              Decline
            </Button>
            <Button
              type="button"
              onClick={() => handleChoice("accepted")}
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
