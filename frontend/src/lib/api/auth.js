// Authentication API — matches AUTHENTICATION_API.md exactly.
//   POST /api/v1/auth/login
//   POST /api/v1/auth/logout
//   GET  /api/v1/auth/me
//
// Signup (POST /api/v1/companies), forgot/reset password, and refresh are
// extended endpoints proposed alongside the frozen contract — not yet in
// the official docs, kept here for now since the Signup/Login pages need them.

import { apiFetch, MOCK_MODE, ApiError } from "../apiClient.js";

const FAKE_LATENCY = 550;

const DEMO_USER = {
  id: "usr_123", name: "Ahmed", email: "ahmed@futurebank.com",
  role: "security_analyst", company_id: "cmp_456", company_name: "FutureBank",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fakeToken(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function login({ email, password }) {
  if (MOCK_MODE) {
    await delay(FAKE_LATENCY);
    if (!email || !password) throw new ApiError("VALIDATION_ERROR", "Email and password are required");
    // Demo credentials for local testing: any email + password of 4+ chars succeeds
    if (password.length < 4) throw new ApiError("INVALID_CREDENTIALS", "Email or password is incorrect");
    return {
      access_token: fakeToken("eyJhbGci"), refresh_token: fakeToken("rft"),
      token_type: "Bearer", expires_in: 3600, user: { ...DEMO_USER, email },
    };
  }
  return apiFetch("/auth/login", { method: "POST", body: { email, password } });
}

export async function signup({ company_name, admin_name, admin_email, password }) {
  if (MOCK_MODE) {
    await delay(FAKE_LATENCY);
    if (!company_name || !admin_name || !admin_email || !password) {
      throw new ApiError("VALIDATION_ERROR", "All fields are required");
    }
    if (password.length < 8) throw new ApiError("WEAK_PASSWORD", "Password must be at least 8 characters");
    return {
      access_token: fakeToken("eyJhbGci"), refresh_token: fakeToken("rft"),
      token_type: "Bearer", expires_in: 3600,
      company: { id: "cmp_" + Math.random().toString(36).slice(2, 8), name: company_name, plan: "free_trial" },
      user: { id: "usr_" + Math.random().toString(36).slice(2, 8), name: admin_name, email: admin_email, role: "admin" },
    };
  }
  return apiFetch("/companies", { method: "POST", body: { company_name, admin_name, admin_email, password } });
}

export async function logout() {
  if (MOCK_MODE) {
    await delay(200);
    return { success: true };
  }
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function getCurrentUser() {
  if (MOCK_MODE) {
    await delay(300);
    return DEMO_USER;
  }
  return apiFetch("/auth/me");
}

export async function refreshToken(refresh_token) {
  if (MOCK_MODE) {
    await delay(300);
    if (!refresh_token) throw new ApiError("INVALID_REFRESH_TOKEN", "Invalid refresh token");
    return { access_token: fakeToken("eyJhbGci"), expires_in: 3600 };
  }
  return apiFetch("/auth/refresh", { method: "POST", body: { refresh_token } });
}

export async function forgotPassword({ email }) {
  if (MOCK_MODE) {
    await delay(FAKE_LATENCY);
    if (!email) throw new ApiError("VALIDATION_ERROR", "Email is required");
    return { message: "Password reset link sent" };
  }
  return apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
}

export async function resetPassword({ token, new_password }) {
  if (MOCK_MODE) {
    await delay(FAKE_LATENCY);
    if (!token || !new_password) throw new ApiError("VALIDATION_ERROR", "Token and new password are required");
    if (new_password.length < 8) throw new ApiError("WEAK_PASSWORD", "Password must be at least 8 characters");
    return { message: "Password updated successfully" };
  }
  return apiFetch("/auth/reset-password", { method: "POST", body: { token, new_password } });
}
