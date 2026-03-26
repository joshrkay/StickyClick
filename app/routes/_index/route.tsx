import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, Link, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { useI18n } from "../../i18n";

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
  const { t } = useI18n();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>{t("landing.title")}</h1>
        <p className={styles.text}>
          {t("landing.description")}
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>{t("landing.shopDomain")}</span>
              <input className={styles.input} type="text" name="shop" />
              <span>{t("landing.shopDomainPlaceholder")}</span>
            </label>
            <button className={styles.button} type="submit">
              {t("landing.logIn")}
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>{t("landing.featureStickyTitle")}</strong>. {t("landing.featureStickyDesc")}
          </li>
          <li>
            <strong>{t("landing.featureUpsellTitle")}</strong>. {t("landing.featureUpsellDesc")}
          </li>
          <li>
            <strong>{t("landing.featureCartTitle")}</strong>. {t("landing.featureCartDesc")}
          </li>
        </ul>
        <nav className={styles.footer} aria-label={t("landing.legal")}>
          <Link to="/privacy">{t("landing.privacyPolicy")}</Link>
          <Link to="/terms">{t("landing.termsOfService")}</Link>
          <Link to="/support">{t("landing.support")}</Link>
        </nav>
      </div>
    </div>
  );
}
