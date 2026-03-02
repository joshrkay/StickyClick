import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async () => {
  return json({});
};

export default function Terms() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Introduction</h2>
      <p>Welcome to StickyClick ("we", "our", or "us"). By installing and using StickyClick, you agree to be bound by the following terms and conditions.</p>

      <h2>2. Use License</h2>
      <p>Permission is granted to install and use the StickyClick Shopify application on your e-commerce store. This license is non-exclusive, non-transferable, and revocable at any time.</p>

      <h2>3. Disclaimer</h2>
      <p>The materials and software on StickyClick are provided on an 'as is' basis. StickyClick makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

      <h2>4. Limitations</h2>
      <p>In no event shall StickyClick or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on StickyClick's website or application.</p>

      <h2>5. Accuracy of Materials</h2>
      <p>The materials appearing on StickyClick's website or application could include technical, typographical, or photographic errors. StickyClick does not warrant that any of the materials on its website are accurate, complete or current.</p>

      <h2>6. Modifications</h2>
      <p>StickyClick may revise these terms of service for its application at any time without notice. By using this application you are agreeing to be bound by the then current version of these terms of service.</p>

      <h2>7. Governing Law</h2>
      <p>These terms and conditions are governed by and construed in accordance with the laws of Delaware and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>

      <h2>8. Contact Us</h2>
      <p>If you have any questions about these Terms, please contact us at support@stickyclick.app.</p>
    </div>
  );
}
