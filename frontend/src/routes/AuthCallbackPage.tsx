// src/routes/AuthCallbackPage.tsx
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import type { AuthTokenResponse } from "@/types/auth";

export const AuthCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeLoginFromCallback } = useAuth();
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const token =
      params.get("token") || params.get("accessToken") || params.get("jwt");
    const steamId = params.get("steamId") || "";
    const appUserPublicId = params.get("appUserPublicId") || "";
    const handle = params.get("handle");
    const displayName = params.get("displayName");
    const isNewUser =
      (params.get("isNewUser") || "").toLowerCase() === "true";

    if (token) {
      hasHandledCallback.current = true;
      console.log("[auth] callback auth payload received", {
        steamId,
        appUserPublicId,
        handle,
        displayName,
        isNewUser,
        hasToken: Boolean(token),
      });

      (async () => {
        await completeLoginFromCallback({
          token,
          steamId,
          isNewUser,
          appUserPublicId,
          handle,
          displayName,
        });
        console.log("[auth] callback navigation to home");
        navigate("/", { replace: true });
      })();

      return;
    }

    if (!token) {
      hasHandledCallback.current = true;
      console.log("[auth] callback reached without auth payload or token");
      // No token? Just boot them home.
      navigate("/", { replace: true });
      return;
    }
  }, [location.search, completeLoginFromCallback, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-app-panel rounded-lg p-4">
        <p className="text-app-muted">Completing login…</p>
      </div>
    </div>
  );
};
