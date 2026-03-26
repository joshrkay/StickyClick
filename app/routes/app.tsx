import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisEn from "@shopify/polaris/locales/en.json";
import polarisEs from "@shopify/polaris/locales/es.json";
import polarisFr from "@shopify/polaris/locales/fr.json";
import polarisDe from "@shopify/polaris/locales/de.json";
import "@shopify/polaris/build/esm/styles.css";
import { Select, InlineStack, Box } from "@shopify/polaris";

import { authenticate, login } from "../shopify.server";
import {
  I18nProvider,
  useI18n,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  type Locale,
} from "../i18n";

const polarisTranslations: Record<Locale, typeof polarisEn> = {
  en: polarisEn,
  es: polarisEs,
  fr: polarisFr,
  de: polarisDe,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
  } catch (error) {
    if (error instanceof Response && [401, 403, 409, 410].includes(error.status)) {
      return login(request);
    }
    throw error;
  }
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

function AppContent() {
  const { locale, setLocale, t } = useI18n();

  return (
    <PolarisAppProvider i18n={polarisTranslations[locale]}>
      <Box padding="200" paddingBlockEnd="0">
        <InlineStack align="end">
          <Box width="160px">
            <Select
              label=""
              labelHidden
              options={SUPPORTED_LOCALES.map((loc) => ({
                label: LOCALE_LABELS[loc],
                value: loc,
              }))}
              value={locale}
              onChange={(val) => setLocale(val as Locale)}
            />
          </Box>
        </InlineStack>
      </Box>
      <s-app-nav>
        <s-link href="/app">{t("nav.settings")}</s-link>
        <s-link href="/app/analytics">{t("nav.analytics")}</s-link>
      </s-app-nav>
      <Outlet />
    </PolarisAppProvider>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const apiKey = "apiKey" in data ? data.apiKey : "";

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ShopifyAppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
