// src/routes/AuthCallbackPage.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

export const AuthCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeLoginFromCallback } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token =
      params.get("token") || params.get("accessToken") || params.get("jwt");

    if (!token) {
      // No token? Just boot them home.
      navigate("/", { replace: true });
      return;
    }

    (async () => {
      await completeLoginFromCallback(token);
      navigate("/", { replace: true });
    })();
  }, [location.search, completeLoginFromCallback, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-app-panel rounded-lg p-4">
        <p className="text-app-muted">Completing login…</p>
      </div>
    </div>
  );
};
