# Contract: API Key Format

> This is an implementation-ready specification, derived directly from [`05-api-keys.md`](../05-api-keys.md) and [`adr/ADR-002-api-key-design.md`](../adr/ADR-002-api-key-design.md).

---

## 1. Structure

An API Key consists of two visible parts and one stored form:

```text
Raw Key (shown once)   → sk_live_<prefix>_<secret>
Stored (persisted)      → key_prefix + key_hash
```

| Part | Purpose | Stored As |
|------|---------|-----------|
| `key_prefix` | A short, non-secret portion shown to the user for identification purposes (e.g., in a list of keys) | Stored in plaintext |
| `secret` | The actual sensitive credential material | **Never stored** — only its hash is kept |
| `key_hash` | A cryptographic hash of the full raw key, used for verification | Stored, `UNIQUE` |

### Example (illustrative only — exact prefix scheme is an implementation detail)

```text
Raw key shown once:   sk_live_ab12_9f8e7d6c5b4a3928...
Displayed afterward:  sk_live_ab12************
```

---

## 2. Lifecycle Contract

```text
1. Generate  → cryptographically random secret generated server-side
2. Display   → shown to the user exactly once, in the API response of the creation call
3. Hash      → the raw secret is hashed (never stored raw) and persisted as key_hash
4. Use       → every subsequent request supplies the raw key; the server hashes the
                incoming value and compares it against key_hash
5. Rotate    → a new key is generated; the old key is marked REVOKED, not deleted
6. Revoke    → key.status is set to REVOKED; the key can never be used again
```

This directly implements the rule: *"API Keys are treated exactly like Passwords"* (see [`05-api-keys.md`](../05-api-keys.md#7-do-we-store-the-raw-api-key-in-the-database)).

---

## 3. Verification Contract

Every incoming request authenticated via API Key must follow this exact sequence (see [`05-api-keys.md`](../05-api-keys.md#6-what-happens-when-a-request-arrives)):

```text
1. Extract API Key from the request (header, e.g. X-API-Key or Authorization: Bearer)
2. Hash the incoming raw key
3. Look up a matching key_hash with status = ACTIVE
4. If not found → Authentication failed (see auth-errors.md)
5. If found → resolve Agent from the key's agent_id
6. Resolve Organization from the Agent's organization_id
7. Build the Authenticated Identity object
8. Pass it forward — the Controller never sees the raw key
```

---

## 4. The Authenticated Identity Object (Agent)

```text
AuthenticatedIdentity {
  id: string          // Agent ID
  type: "AGENT"
  organization_id: string    // resolved via Agent → Organization
}
```

---

## 5. Business Rules Enforced at the Application Layer (Not the Database)

| Rule | Enforcement Point |
|------|---------------------|
| Only one `ACTIVE` key per Agent at any time | Application logic — when creating a new key, any existing `ACTIVE` key for that Agent must be transitioned first, within the same transaction |
| `organization_id` used in the Authenticated Identity must match the Agent's actual `organization_id` | Application logic — always derived server-side from the Agent record, never accepted from client input |

---

## 6. SDK Configuration Contract

The SDK requires **exactly two values**, and nothing else (see [`05-api-keys.md`](../05-api-keys.md#12-does-the-sdk-know-anything-other-than-the-api-key)):

```text
API_KEY   = <the raw key, shown once at creation>
API_URL   = <the platform's API endpoint>
```

The SDK must **never** be configured with, or send, a `organization_id` or `agent_id` — these are always resolved server-side from the API Key.

---

## 7. Related Status Values

See the full enum definition in the API Key state diagram: [`diagrams/state/`](../diagrams/state).

```text
ACTIVE   → usable for authentication
REVOKED  → permanently unusable, retained for audit purposes only
```
