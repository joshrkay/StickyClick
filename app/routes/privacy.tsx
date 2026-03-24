export default function Privacy() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Privacy Policy for StickyClick</h1>
      <p>Last updated: March 24, 2026</p>

      <h2>1. Introduction</h2>
      <p>
        StickyClick (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is a Shopify application that adds a
        configurable sticky add-to-cart experience to your storefront. This policy describes what we process when you
        install and use the app.
      </p>

      <h2>2. Information we process</h2>
      <p>Depending on how you use StickyClick, we may process:</p>
      <ul>
        <li>
          <strong>Shop and staff session data (OAuth).</strong> When you open the app in the Shopify admin, we use
          Shopify&rsquo;s authentication to obtain an access token scoped to the permissions you approve. Session data
          is stored so the app can load your settings and sync configuration.
        </li>
        <li>
          <strong>App configuration in our database.</strong> We store per-shop settings you configure in the app
          (for example button text, colors, feature toggles). This is stored in our application database keyed by your
          shop domain.
        </li>
        <li>
          <strong>Shop metafield (storefront).</strong> When you save settings, we write a JSON metafield on your shop
          (<code>stickyclick.settings</code>) so your theme app extension can read the same configuration on the
          storefront.
        </li>
        <li>
          <strong>Optional analytics (Premium).</strong> If you enable analytics, the storefront script sends
          aggregated events (such as impressions, clicks, and add-to-cart) to our servers through Shopify&rsquo;s
          signed App Proxy. Events may include your shop domain, event type, and product variant identifiers. We do not
          use this flow to collect buyer names, emails, or full payment details.
        </li>
      </ul>

      <h2>3. How we use information</h2>
      <p>We use the information above to provide and improve the Service: render the sticky button, sync settings to
        your storefront, and (when enabled) show analytics in the admin.</p>

      <h2>4. Sharing</h2>
      <p>
        We do not sell your personal information. We use service providers (for example hosting and database) to run
        the app. We may disclose information if required by law or to protect our rights.
      </p>

      <h2>5. Data retention and deletion</h2>
      <p>
        When you uninstall the app, we delete app sessions and remove stored shop settings and analytics events from
        our database where possible. We attempt to remove the shop metafield while the uninstall webhook still has
        valid access. Shopify may also send mandatory privacy webhooks (including shop data erasure) under our
        obligations as a Shopify app developer; we process those requests to delete remaining app-held data tied to
        your shop.
      </p>

      <h2>6. Changes</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by updating the date above.</p>

      <h2>7. Contact</h2>
      <p>Questions: <a href="mailto:support@stickyclick.app">support@stickyclick.app</a></p>
    </div>
  );
}
