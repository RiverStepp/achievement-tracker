const LAST_UPDATED = "April 28, 2026";

export const PrivacyPolicyPage = () => {
  return (
    <div className="w-full flex justify-center min-h-0">
      <article className="w-full max-w-4xl space-y-8 rounded-lg bg-app-panel p-6 shadow-md shadow-app-border">
        <header className="space-y-2">
          <h1 className="app-heading text-2xl">Privacy Policy</h1>
          <p className="text-sm text-app-muted">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm leading-relaxed text-app-text">
            This policy describes what information OpenAchievements collects,
            how we use it, and what control you have over your data.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="app-heading text-lg">Information We Collect</h2>
          <p className="text-sm leading-relaxed text-app-text">
            We collect Steam identity data such as Steam64Id, persona name, and
            avatar URL. We also store game ownership, achievement unlock data,
            and playtime data.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            If you edit your profile, we store information you submit such as
            display name, handle, bio, pronouns, location, timezone, and social
            links.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            We collect data through Steam OpenID sign-in, Steam Web API
            requests, and scraping of publicly accessible achievement data from
            sources such as Exophase. We also collect data you enter directly in
            account settings and community features.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            OpenAchievements may create a profile for a Steam user before they
            log in, using publicly available Steam data. When that person signs
            in through Steam OpenID, they can claim the existing profile.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            Authentication is handled through Steam OpenID. We use JWT access
            tokens and refresh tokens, with refresh tokens stored in HTTP-only
            cookies to keep you signed in securely.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="app-heading text-lg">How We Use, Store, and Share Information</h2>
          <p className="text-sm leading-relaxed text-app-text">
            We use collected data to render profiles, calculate achievement
            statistics, compute leaderboard rankings, power social and feed
            features, and operate the public API.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            Data is stored in Microsoft SQL Server and Redis (for caching and
            rate limiting). We use HTTPS for communication between your browser
            and the service.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            We do not sell your personal data. We rely on third-party data
            sources such as Steam and Exophase, and some achievement/profile
            data is made available through our public API.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            Profile and achievement data is retained while a profile exists on
            the platform. Because leaderboards and profile history rely on this
            data, retention may continue unless the profile is removed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="app-heading text-lg">Your Choices and Rights</h2>
          <p className="text-sm leading-relaxed text-app-text">
            You can update profile metadata and social settings in your account
            settings. Account deletion and complete data export are not fully
            self-serve yet; we plan to add stronger controls as the project
            matures.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            OpenAchievements is not intended for children under 13. If you
            believe a child has provided personal information in violation of
            this policy, contact the project maintainers.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            We may update this Privacy Policy as features and data practices
            evolve. The Last updated date reflects the current version.
          </p>
        </section>
      </article>
    </div>
  );
};
