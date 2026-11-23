# Security Register & Threat Log

## Security Standards & Severity Framework
- **Frameworks**: OWASP Top 10 (2021), OWASP ASVS v4.0.3, Least Privilege Principle.
- **Severity Tiers**: Critical, High, Medium, Low, Informational.

---

## Active Security Findings & Audit Log

### [SEC-AUD-01]: Unauthenticated Administrative Endpoints & Database Wipe
- **Severity**: Critical (A01:2021 - Broken Access Control)
- **Status**: Triaged / High Priority Fix
- **Assigned Agent**: senior-engineer
- **Component**: `server/api.ts` (lines 924–1164)
- **Threat Vector**: Endpoints under `/api/admin/*` (`delete-all`, `batch-delete`, `users`) lack authentication/role checks, allowing anonymous users to wipe data or view user emails.
- **Remediation**: Implement and mount strict `requireAdmin` middleware requiring verified admin session.

---

### [SEC-AUD-02]: Spot Ownership Spoofing via Mutable Display Name (IDOR)
- **Severity**: Critical (A01:2021 - Broken Access Control)
- **Status**: Triaged / High Priority Fix
- **Assigned Agent**: senior-engineer
- **Component**: `server/api.ts` (lines 610–619, 659–668)
- **Threat Vector**: Ownership check permits matching on mutable `displayName`, enabling attackers to claim ownership of other users' spots by renaming their profile.
- **Remediation**: Enforce strict immutable `ownerId` and `ownedSpotIds` matching; remove name-based matching.

---

### [SEC-AUD-03]: Passwordless Authentication & Email-Based Admin Privilege Escalation
- **Severity**: Critical (A07:2021 - Identification & Auth Failures)
- **Status**: Triaged / High Priority Fix
- **Assigned Agent**: senior-engineer
- **Component**: `server/api.ts` (lines 456–566)
- **Threat Vector**: Email addresses containing `"admin"` automatically receive admin role; login does not verify passwords; session tokens use `Math.random()`.
- **Remediation**: Use cryptographic tokens (`crypto.randomBytes(32)`), remove substring-based admin escalation, and enforce secure auth.

---

### [SEC-AUD-04]: Audio Upload Client-Trusted MIME & Unverified Duration
- **Severity**: High (A04:2021 - Insecure Design)
- **Status**: Triaged / High Priority Fix
- **Assigned Agent**: senior-engineer
- **Component**: `server/audioService.ts`, `server/api.ts`
- **Threat Vector**: `/api/upload-audio` accepts unauthenticated uploads, trusts client `mimeType` without magic byte inspection, and trusts client duration.
- **Remediation**: Validate audio buffer magic headers (WebM, OGG, MP3, M4A) and require authentication.

---

### [SEC-AUD-05]: Raw GIF Passthrough Without Magic Byte Re-encoding
- **Severity**: High (A04:2021 - Insecure Design)
- **Status**: Triaged / High Priority Fix
- **Assigned Agent**: senior-engineer
- **Component**: `server/imageService.ts` (lines 135–138, 313–347)
- **Threat Vector**: Raw GIF buffer is written directly to disk based on extension or 3-byte prefix without sanitization or Sharp re-encoding.
- **Remediation**: Validate 6-byte header (`GIF87a`/`GIF89a`) and process via Sharp animation pipeline.

---

### [SEC-AUD-06]: HEIC Decompression Dimension Check & Tensor Memory Safeguards
- **Severity**: High (A05:2021 - Security Misconfiguration)
- **Status**: Triaged / In Progress
- **Assigned Agent**: senior-engineer
- **Component**: `server/safetyService.ts`, `server/imageService.ts`
- **Threat Vector**: Potential OOM from oversized HEIC dimension inputs; tensor cleanup outside `finally` block; fail-open catch block.
- **Remediation**: Cap maximum dimensions (4096x4096), wrap tensors in `try/finally`, and reject unparseable files rather than failing open.

---

### [SEC-AUD-07]: Payment Verification Backdoor Active in All Environments
- **Severity**: High (A04:2021 - Insecure Design)
- **Status**: Triaged / High Priority Fix
- **Assigned Agent**: senior-engineer
- **Component**: `server/razorpay.ts` (lines 44–53), `server/api.ts` (line 766)
- **Threat Vector**: `'simulated_test_pass'` signature accepted unconditionally, allowing free spot creation in production.
- **Remediation**: Guard mock payment simulation strictly behind `process.env.NODE_ENV !== 'production'`.

---

### [SEC-AUD-08]: Path Traversal Guard on Asset Hash Route
- **Severity**: Medium (A01:2021 - Broken Access Control)
- **Status**: Triaged
- **Assigned Agent**: senior-engineer
- **Component**: `server.ts` (lines 38–53)
- **Remediation**: Add regex guard `/^[a-f0-9]{12,64}$/i` on route parameters before resolving disk paths.

---

### [SEC-AUD-09]: Error Response Information Leakage
- **Severity**: Medium (A05:2021 - Security Misconfiguration)
- **Status**: Triaged
- **Assigned Agent**: senior-engineer
- **Component**: `server/api.ts`
- **Remediation**: Strip raw error stacks in production error responses.

---

### [SEC-AUD-10]: Security Headers & Upload Rate Limiting
- **Severity**: Medium (A05:2021 - Security Misconfiguration)
- **Status**: Triaged
- **Assigned Agent**: senior-engineer
- **Component**: `server.ts`
- **Remediation**: Set `X-Content-Type-Options: nosniff` on `/uploads` and add rate limiting on upload endpoints.
