import type { LoginError } from "@shopify/shopify-app-react-router/server";
import { LoginErrorType } from "@shopify/shopify-app-react-router/server";

interface LoginErrorMessage {
  shop?: string;
}

export function loginErrorMessage(loginErrors: LoginError): LoginErrorMessage {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return { shop: "login.errorMissingShop" };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return { shop: "login.errorInvalidShop" };
  }

  return {};
}
