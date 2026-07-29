// Team / Organization Membership API — NOT part of the frozen v1.0 API
// documentation set (that only covers Auth, Agents, Observations, Alerts,
// Dashboard). This module implements the Organization & Identity Lifecycle
// described in the Authentication Design (Session 8):
//
//   Owner invites -> Invitation (pending) -> person Accepts -> Member created
//
// Two distinct resources, matching the doc precisely:
//   - Members:     real accounts with an active Membership in the Org.
//   - Invitations: pending trust objects; NOT accounts. A Member is only
//                  created when an invitation is accepted.
//
// This is clearly labeled as an extended/proposed surface — needs sign-off
// from the Backend team before being treated as a real contract, same as
// the rest of api/team.js's predecessor.

import { MOCK_MODE, ApiError } from "../apiClient.js";
import { db } from "../mockDb.js";

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockOrThrow(fn) {
  await delay();
  try {
    return fn();
  } catch (e) {
    // Surface mockDb's plain Error messages (e.g. "already has a pending
    // invitation") as a proper ApiError so callers have one error shape
    // to handle, consistent with every other api/*.js module.
    throw new ApiError("VALIDATION_ERROR", e.message);
  }
}

// --- Members ---------------------------------------------------------

export async function listMembers() {
  if (MOCK_MODE) {
    await delay();
    return db.getMembers();
  }
  // Real endpoint not in the frozen docs yet — placeholder path
  throw new ApiError("NOT_IMPLEMENTED", "Real Members API not yet available");
}

export async function updateMemberRole(memberId, role) {
  if (MOCK_MODE) return mockOrThrow(() => db.updateMemberRole(memberId, role));
  throw new ApiError("NOT_IMPLEMENTED", "Real Members API not yet available");
}

export async function removeMember(memberId) {
  if (MOCK_MODE) return mockOrThrow(() => db.removeMember(memberId));
  throw new ApiError("NOT_IMPLEMENTED", "Real Members API not yet available");
}

// --- Invitations -------------------------------------------------------

export async function listInvitations() {
  if (MOCK_MODE) {
    await delay();
    return db.getInvitations();
  }
  throw new ApiError("NOT_IMPLEMENTED", "Real Invitations API not yet available");
}

export async function inviteMember(email, role) {
  if (MOCK_MODE) return mockOrThrow(() => db.inviteMember(email, role));
  throw new ApiError("NOT_IMPLEMENTED", "Real Invitations API not yet available");
}

export async function resendInvitation(invitationId) {
  if (MOCK_MODE) return mockOrThrow(() => db.resendInvitation(invitationId));
  throw new ApiError("NOT_IMPLEMENTED", "Real Invitations API not yet available");
}

export async function cancelInvitation(invitationId) {
  if (MOCK_MODE) return mockOrThrow(() => db.cancelInvitation(invitationId));
  throw new ApiError("NOT_IMPLEMENTED", "Real Invitations API not yet available");
}
