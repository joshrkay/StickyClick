import { useI18n } from "../i18n";

export default function Privacy() {
  const { t } = useI18n();

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>{t("privacy.title")}</h1>
      <p>{t("privacy.lastUpdated")}</p>

      <h2>{t("privacy.introTitle")}</h2>
      <p>{t("privacy.introText")}</p>

      <h2>{t("privacy.infoTitle")}</h2>
      <p>{t("privacy.infoText")}</p>
      <ul>
        <li>
          <strong>{t("privacy.infoSessionTitle")}</strong> {t("privacy.infoSessionText")}
        </li>
        <li>
          <strong>{t("privacy.infoConfigTitle")}</strong> {t("privacy.infoConfigText")}
        </li>
        <li>
          <strong>{t("privacy.infoMetafieldTitle")}</strong> {t("privacy.infoMetafieldText")}
        </li>
        <li>
          <strong>{t("privacy.infoAnalyticsTitle")}</strong> {t("privacy.infoAnalyticsText")}
        </li>
      </ul>

      <h2>{t("privacy.useTitle")}</h2>
      <p>{t("privacy.useText")}</p>

      <h2>{t("privacy.sharingTitle")}</h2>
      <p>{t("privacy.sharingText")}</p>

      <h2>{t("privacy.retentionTitle")}</h2>
      <p>{t("privacy.retentionText")}</p>

      <h2>{t("privacy.changesTitle")}</h2>
      <p>{t("privacy.changesText")}</p>

      <h2>{t("privacy.contactTitle")}</h2>
      <p>{t("privacy.contactText")} <a href="mailto:support@stickyclick.app">support@stickyclick.app</a></p>
    </div>
  );
}
