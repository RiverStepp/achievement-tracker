import { Link } from "react-router-dom";

const BRAND_NAME = "OpenAchievements";

export const SiteFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-6 border-t border-app-border/80 py-4">
      <div className="flex flex-col gap-3 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {currentYear} {BRAND_NAME}. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link
            to="/terms"
            className="transition-colors hover:text-app-text"
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            className="transition-colors hover:text-app-text"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
};
