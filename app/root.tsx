import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
import { I18nProvider, useI18n } from "./i18n";

function HtmlShell({ children }: { children: React.ReactNode }) {
  let lang = "en";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { locale } = useI18n();
    lang = locale;
  } catch {
    // I18nProvider not mounted yet (e.g. error boundary); fall back to "en"
  }

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <HtmlShell>
        <Outlet />
      </HtmlShell>
    </I18nProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  // Error boundary renders outside the I18nProvider, so we read locale from
  // localStorage directly for the lang attribute and use a simple map.
  let lang = "en";
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("stickyclick_locale");
    if (stored && ["en", "es", "fr", "de"].includes(stored)) lang = stored;
  }

  const errorStrings: Record<string, { somethingWrong: string; unexpected: string; refresh: string }> = {
    en: { somethingWrong: "Something went wrong", unexpected: "An unexpected error occurred.", refresh: "Please try refreshing the page." },
    es: { somethingWrong: "Algo salió mal", unexpected: "Ocurrió un error inesperado.", refresh: "Intenta actualizar la página." },
    fr: { somethingWrong: "Une erreur est survenue", unexpected: "Une erreur inattendue s'est produite.", refresh: "Veuillez essayer de rafraîchir la page." },
    de: { somethingWrong: "Etwas ist schiefgelaufen", unexpected: "Ein unerwarteter Fehler ist aufgetreten.", refresh: "Bitte versuche, die Seite zu aktualisieren." },
  };

  const s = errorStrings[lang] || errorStrings.en;

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>
            {isRouteErrorResponse(error)
              ? `${error.status} — ${error.statusText}`
              : s.somethingWrong}
          </h1>
          <p>
            {isRouteErrorResponse(error)
              ? typeof error.data === "string"
                ? error.data
                : s.unexpected
              : s.refresh}
          </p>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
