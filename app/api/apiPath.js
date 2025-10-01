// সব API endpoint এক জায়গায়
export const API_PATH = {
  HOMEPAGE_MULTIPLIER_GET: "/api/new-api/homepage/multiplier-get",
  HOMEPAGE_EMAIL_POST_BALANCE_GET:
    "/api/new-api/homepage/email-post-balance-get",
  BETTING_POST: "/api/open-api/upload-bet/betting-post-api",
};
// /app/api/apiPath.ts
// 🔗 সব API URL এক জায়গায়

// /app/api/apiPath.js
// 🔗 Topbar related APIs (centralized)
export const API_TOPBAR_USER_DATA_POST =
  "/api/open-api/topbar/user-data-post-api"; // POST { email }
export const API_TOPBAR_SIGN_OUT_POST =
  "/api/open-api/topbar/sign-out-post-api"; // POST
