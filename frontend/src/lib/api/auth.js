// Authentication API — matches AUTHENTICATION_API.md and the Backend's
// actual RegisterRequest/LoginRequest validated field sets exactly.
//   POST /api/v1/auth/register
//   POST /api/v1/auth/login
//   POST /api/v1/auth/logout
//   GET  /api/v1/auth/me
//   POST /api/v1/auth/refresh
//
// forgot/reset password are extended endpoints proposed alongside the
// frozen contract — not yet in the official docs, kept here for now since
// the Login page needs them for its "forgot password" link.

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
    // No refresh_token — the real Backend never issues one either (a single
    // JWT access token, refreshed via the Authorization header itself, not
    // a second token). See CONTRACT-007.
    return {
      access_token: fakeToken("eyJhbGci"),
      token_type: "Bearer", expires_in: 3600, user: { ...DEMO_USER, email },
    };
  }
  return apiFetch("/auth/login", { method: "POST", body: { email, password } });
}

// Field names and the endpoint itself match RegisterRequest's validated set
// exactly (organization_name/full_name/email/password/password_confirmation)
// — see CONTRACT-006. Callers (Signup.jsx) are responsible for supplying
// password_confirmation; this function does not rename or reshape input.
export async function signup({ organization_name, full_name, email, password, password_confirmation }) {
  if (MOCK_MODE) {
    await delay(FAKE_LATENCY);
    if (!organization_name || !full_name || !email || !password) {
      throw new ApiError("VALIDATION_ERROR", "All fields are required");
    }
    if (password !== password_confirmation) {
      throw new ApiError("VALIDATION_ERROR", "Password confirmation does not match");
    }
    if (password.length < 8) throw new ApiError("WEAK_PASSWORD", "Password must be at least 8 characters");
    return {
      access_token: fakeToken("eyJhbGci"),
      token_type: "Bearer", expires_in: 3600,
      company: { id: "cmp_" + Math.random().toString(36).slice(2, 8), name: organization_name, plan: "free_trial" },
      user: { id: "usr_" + Math.random().toString(36).slice(2, 8), name: full_name, email, role: "owner" },
    };
  }
  return apiFetch("/auth/register", {
    method: "POST",
    body: { organization_name, full_name, email, password, password_confirmation },
  });
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

// No refresh_token parameter — the real Backend re-issues a token from the
// currently-authenticated JWT itself (the Authorization header apiFetch
// already attaches on every request), not from a request-body token. See
// CONTRACT-007.
export async function refreshToken() {
  if (MOCK_MODE) {
    await delay(300);
    return { access_token: fakeToken("eyJhbGci"), expires_in: 3600 };
  }
  return apiFetch("/auth/refresh", { method: "POST" });
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
