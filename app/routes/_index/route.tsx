import type { LoaderFunctionArgs } from "react-router";
import { redirect, Link } from "react-router";

import { authenticate, login } from "../../shopify.server";
import { useI18n } from "../../i18n";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
  } catch (error) {
    if (error instanceof Response && [401, 403, 409, 410].includes(error.status)) {
      return login(request);
    }
    throw error;
  }

  throw redirect("/app");
};

export default function App() {
  const { t } = useI18n();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>{t("landing.title")}</h1>
        <p className={styles.text}>{t("landing.description")}</p>
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
