import { useI18n } from "../i18n";

export default function Terms() {
  const { t } = useI18n();

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>{t("terms.title")}</h1>
      <p>{t("terms.lastUpdated")}</p>

      <h2>{t("terms.introTitle")}</h2>
      <p>{t("terms.introText")}</p>

      <h2>{t("terms.licenseTitle")}</h2>
      <p>{t("terms.licenseText")}</p>

      <h2>{t("terms.disclaimerTitle")}</h2>
      <p>{t("terms.disclaimerText")}</p>

      <h2>{t("terms.limitationsTitle")}</h2>
      <p>{t("terms.limitationsText")}</p>

      <h2>{t("terms.accuracyTitle")}</h2>
      <p>{t("terms.accuracyText")}</p>

      <h2>{t("terms.modificationsTitle")}</h2>
      <p>{t("terms.modificationsText")}</p>

      <h2>{t("terms.governingTitle")}</h2>
      <p>{t("terms.governingText")}</p>

      <h2>{t("terms.contactTitle")}</h2>
      <p>{t("terms.contactText")}</p>
    </div>
  );
}
