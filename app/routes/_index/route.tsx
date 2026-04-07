import type { LoaderFunctionArgs } from "react-router";
import { redirect, Link } from "react-router";

import { authenticate, login } from "../../shopify.server";
import { useI18n } from "../../i18n";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const isEmbeddedRequest =
    url.searchParams.get("embedded") === "1" ||
    url.searchParams.has("host") ||
    url.searchParams.has("id_token");

  try {
    await authenticate.admin(request);
    throw redirect("/app");
  } catch (error) {
    if (error instanceof Response && [401, 403, 409, 410].includes(error.status)) {
      if (isEmbeddedRequest || url.searchParams.has("shop")) {
        const loginResult = await login(request);
        if (loginResult instanceof Response) {
          throw loginResult;
        }
      }
    }

    throw error;
  }

  return { showForm: true };
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
