const LAST_UPDATED = "April 28, 2026";

export const TermsOfServicePage = () => {
  return (
    <div className="w-full flex justify-center min-h-0">
      <article className="w-full max-w-4xl space-y-8 rounded-lg bg-app-panel p-6 shadow-md shadow-app-border">
        <header className="space-y-2">
          <h1 className="app-heading text-2xl">Terms of Service</h1>
          <p className="text-sm text-app-muted">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm leading-relaxed text-app-text">
            These Terms govern your use of the OpenAchievements hosted service.
            OpenAchievements is open-source software, but use of the hosted
            website is still subject to these service terms.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="app-heading text-lg">Using the Service</h2>
          <p className="text-sm leading-relaxed text-app-text">
            You agree to use OpenAchievements lawfully and respectfully. You are
            responsible for activity performed through your account and for
            keeping your Steam account secure.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            OpenAchievements uses Steam OpenID 2.0 for login. We do not collect
            or process your Steam password. Access to your account depends on
            your ability to authenticate with Steam.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            The platform may create unclaimed profiles from publicly available
            Steam data before a person signs in. If you later sign in with that
            Steam account, you may claim the existing profile.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            We collect data from the Steam Web API and from publicly accessible
            sources such as Exophase. Some features depend on third-party
            systems that may be unavailable, change behavior, or limit access.
            We do not guarantee uninterrupted service or real-time data
            freshness.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            Achievement point values, leaderboard positions, and related
            calculations are determined by OpenAchievements and may change over
            time as methodology evolves. Historical rankings and points may be
            recalculated when scoring rules change.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="app-heading text-lg">Community Content and Moderation</h2>
          <p className="text-sm leading-relaxed text-app-text">
            You may provide profile content (such as display name, handle, bio,
            pronouns, social links, and location) and create community posts.
            You retain ownership of your content, but you grant us permission to
            host and display it as needed to operate the service.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            We may moderate, remove, or limit content that is abusive, unlawful,
            deceptive, or otherwise harmful to the community.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            You agree not to misuse the service, attempt unauthorized access,
            disrupt normal operation, or use automated methods that create
            unreasonable load.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="app-heading text-lg">Open-Source and Service Updates</h2>
          <p className="text-sm leading-relaxed text-app-text">
            The source code may be available under a separate open-source
            license. That license governs code use and contribution. These Terms
            govern use of the hosted OpenAchievements service and community.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            We may update features, data processing behavior, or these Terms as
            the project evolves. Material updates will be reflected by changing
            the Last updated date on this page.
          </p>
          <p className="text-sm leading-relaxed text-app-muted">
            If you have questions about these Terms, open an issue in the
            project repository.
          </p>
        </section>
      </article>
    </div>
  );
};
