# MCC → SILAS + Microsoft Entra integration plan


## References
- MoJ Staff Identity developer patterns (Auth Code, OBO, S2S):
  https://user-guide.staff-identity.service.justice.gov.uk/documentation/fundamentals/developer-patterns.html#sequencenumber
- LAA Service Onboarding Guide links (Atlassian):
  https://dsdmoj.atlassian.net/wiki/spaces/LS/pages/6002638890/LAA+Service+Onboarding+Guide
  https://dsdmoj.atlassian.net/wiki/spaces/LS/pages/5892669698/LAA+Service+Onboarding+Guide+MOVED
- `cla_backend` PR: `ministryofjustice/cla_backend#1354` (SILAS/Entra integration):
  https://github.com/ministryofjustice/cla_backend/pull/1354/changes


---

## Target architecture

Use **Authorization Code flow** for MCC (server-side web app) with SILAS/Entra.

### Recommended request flow
1. User hits MCC protected route.
2. MCC redirects to SILAS/Entra authorize endpoint.
3. SILAS/Entra returns auth code to MCC callback.
4. MCC exchanges code for tokens (server-side).
5. MCC stores minimal user identity + access token in server session.
6. MCC sends `Authorization: Bearer <access_token>` to backend API.
7. Backend API validates Entra token.

### Pattern from MoJ docs
- **Auth Code**: user login in web app (MCC)
- **OBO**: required where MCC must call downstream API with exchanged token.
- **S2S**: not primary for interactive caseworker sign-in.

---

## Local developer setup

Use two modes locally so developer experience stays practical while runtime auth remains realistic.

### Mode A — Run MCC locally with real SILAS/Entra login
- Use a non-production Entra/SILAS app registration for local development.
- Ensure local redirect URI is registered (for example: `http://localhost:3000/login/callback`).
- Sign in with valid user accounts in the correct tenant.
- Set local environment values for the SILAS/Entra variables listed below.

### Mode B — Run unit tests without SILAS secrets
- Unit tests should not require live SILAS/Entra credentials.
- SILAS config validation is skipped during test execution (`NODE_ENV=test`).

---

## Progress tracker (remaining work only)

### Remaining tasks (only applied to UAT for now):
- [ ] ⏳ Ongoing — Request Entra account for MCC team members (human user accounts in the correct tenant).
- [ ] ⏳ Ongoing — Request SiLAS account/onboarding access for MCC service integration.
- [ ] Configure tenant/client/scopes/redirects (BLOCKED: waiting for account setup). See MoJ link above for more details on how to do this - needs admin account to log in to Entra.
- [ ] Confirm with CLA team what scopes MCC should be using in API calls.
- [ ] Add Entra/SILAS secrets to platform environment config (not sure how to do this - probably somewhere on cloud-platform-environments repo? - maybe ask CLA team)
  Needed secrets:
   - `ENTRA_TENANT_ID`
   - `ENTRA_CLIENT_ID`
   - `ENTRA_CLIENT_SECRET`
   - `ENTRA_REDIRECT_URI`
   - `ENTRA_POST_LOGOUT_REDIRECT_URI`
   - `ENTRA_AUTHORITY` (or derive from tenant)
   - `SILAS_SCOPES` (space-separated)
   - `SILAS_EXPECTED_AUDIENCE` (if needed for validation checks)


## Things I have definitely missed for this POC
- Check that token `aud` and `iss` exactly match backend expectations.
- Check required scopes/roles present in access token.
- Check rmail/identity claim mapping (`preferred_username`) resolves to existing provider users.
- Session secret/redis config present and secure in each environment.
- Logout clears MCC session and (if required) triggers SILAS/Entra sign-out endpoint.
