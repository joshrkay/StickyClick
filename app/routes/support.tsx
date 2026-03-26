import { useI18n } from "../i18n";

export default function Support() {
  const { t } = useI18n();

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>{t("support.title")}</h1>
      <p>{t("support.subtitle")}</p>

      <h2>{t("support.contactUs")}</h2>
      <p>{t("support.contactDesc")}</p>
      <p>
        <a href="mailto:support@stickyclick.app" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold" }}>
          support@stickyclick.app
        </a>
      </p>

      <h2>{t("support.hours")}</h2>
      <p>{t("support.hoursDetail")}</p>
      <p>{t("support.responseTime")}</p>

      <h2>{t("support.commonIssues")}</h2>
      <ul>
        <li>{t("support.issueInstallation")}</li>
        <li>{t("support.issueCustomizing")}</li>
        <li>{t("support.issueBilling")}</li>
      </ul>
      <p>{t("support.reachOut")}</p>
    </div>
  );
}
