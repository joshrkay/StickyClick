export default function Privacy() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Privacy Policy for StickyClick</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. Introduction</h2>
      <p>StickyClick (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share your personal information when you use our Shopify application.</p>

      <h2>2. Information We Collect</h2>
      <p>When you install the App, we are automatically able to access certain types of information from your Shopify account:</p>
      <ul>
        <li>Shop information (shop domain, email, shop owner name)</li>
        <li>Product information (to enable sticky add-to-cart functionality)</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use the personal information we collect from you and your customers in order to provide the Service and to operate the App. Additionally, we use this personal information to:</p>
      <ul>
        <li>Communicate with you regarding the App</li>
        <li>Optimize or improve the App</li>
        <li>Provide you with information or advertising relating to our products or services</li>
      </ul>

      <h2>4. Sharing Your Personal Information</h2>
      <p>We may share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.</p>

      <h2>5. Data Retention</h2>
      <p>When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.</p>

      <h2>6. Changes</h2>
      <p>We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.</p>

      <h2>7. Contact Us</h2>
      <p>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at support@stickyclick.app.</p>
    </div>
  );
}
