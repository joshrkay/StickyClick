import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import { useI18n } from "../../i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;
  const { t } = useI18n();

  // Resolve error keys to translated strings
  const resolvedErrors = {
    shop: errors.shop ? t(errors.shop) : undefined,
  };

  return (
    <AppProvider embedded={false}>
      <s-page>
        <Form method="post">
        <s-section heading={t("login.heading")}>
          <s-text-field
            name="shop"
            label={t("login.shopDomain")}
            details={t("login.shopDomainHint")}
            value={shop}
            onChange={(e) => setShop(e.currentTarget.value)}
            autocomplete="on"
            error={resolvedErrors.shop}
          ></s-text-field>
          <s-button type="submit">{t("login.logIn")}</s-button>
        </s-section>
        </Form>
      </s-page>
    </AppProvider>
  );
}
