// Mock implementation of the Authentication API described in the SentinelX API Contract.
// Every function here mirrors a real endpoint 1:1 so swapping to real fetch() calls later
// is just replacing the body of each function — the shape stays identical.
//
//   POST /api/v1/auth/login
//   POST /api/v1/auth/logout
//   GET  /api/v1/auth/me
//   POST /api/v1/auth/refresh
//   POST /api/v1/auth/forgot-password
//   POST /api/v1/auth/reset-password
//   POST /api/v1/companies                (signup)

const FAKE_LATENCY = 550;

const DEMO_USER = {
  id: "usr_123",
  name: "Ahmed",
  email: "ahmed@futurebank.com",
  role: "security_analyst",
  company_id: "cmp_456",
  company_name: "FutureBank",
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fakeToken(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function login({ email, password }) {
  await wait(FAKE_LATENCY);
  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  // Demo credentials for local testing: any email + password length >= 4 succeeds
  if (password.length < 4) {
    const err = new Error("Email or password is incorrect");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }
  return {
    access_token: fakeToken("eyJhbGci"),
    refresh_token: fakeToken("rft"),
    token_type: "Bearer",
    expires_in: 3600,
    user: { ...DEMO_USER, email },
  };
}

export async function signup({ company_name, admin_name, admin_email, password }) {
  await wait(FAKE_LATENCY);
  if (!company_name || !admin_name || !admin_email || !password) {
    const err = new Error("All fields are required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (password.length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.code = "WEAK_PASSWORD";
    throw err;
  }
  return {
    access_token: fakeToken("eyJhbGci"),
    refresh_token: fakeToken("rft"),
    token_type: "Bearer",
    expires_in: 3600,
    company: { id: "cmp_" + Math.random().toString(36).slice(2, 8), name: company_name, plan: "free_trial" },
    user: { id: "usr_" + Math.random().toString(36).slice(2, 8), name: admin_name, email: admin_email, role: "admin" },
  };
}

export async function logout() {
  await wait(200);
  return { success: true };
}

export async function getCurrentUser(token) {
  await wait(300);
  if (!token) {
    const err = new Error("Not authenticated");
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return DEMO_USER;
}

export async function refreshToken(refresh_token) {
  await wait(300);
  if (!refresh_token) {
    const err = new Error("Invalid refresh token");
    err.code = "INVALID_REFRESH_TOKEN";
    throw err;
  }
  return { access_token: fakeToken("eyJhbGci"), expires_in: 3600 };
}

export async function forgotPassword({ email }) {
  await wait(FAKE_LATENCY);
  if (!email) {
    const err = new Error("Email is required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return { message: "Password reset link sent" };
}

export async function resetPassword({ token, new_password }) {
  await wait(FAKE_LATENCY);
  if (!token || !new_password) {
    const err = new Error("Token and new password are required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (new_password.length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.code = "WEAK_PASSWORD";
    throw err;
  }
  return { message: "Password updated successfully" };
}
