import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, Link, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>StickyClick</h1>
        <p className={styles.text}>
          A sticky Add to Cart button that boosts conversions on your Shopify store.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Sticky Add to Cart</strong>. A floating button that follows
            shoppers as they scroll, so they can add to cart anytime.
          </li>
          <li>
            <strong>Upsell &amp; Quick Buy</strong>. Offer a recommended product
            alongside the main item and send customers straight to checkout.
          </li>
          <li>
            <strong>Cart Summary &amp; Free Shipping Bar</strong>. Show live cart
            totals and motivate larger orders with a progress bar toward free shipping.
          </li>
        </ul>
        <nav className={styles.footer} aria-label="Legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support</Link>
        </nav>
      </div>
    </div>
  );
}
