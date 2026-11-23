# Security Register & Threat Log

## Security Standards & Severity Framework
- **Frameworks**: OWASP Top 10 (2021), OWASP ASVS v4.0.3, Least Privilege Principle.
- **Severity Tiers**: Critical, High, Medium, Low, Informational.

---

## Security Audit Log

### [SEC-001]: File Upload Validation & MIME Sniffing Defense
- **Severity**: Medium
- **Status**: Scheduled for Audit
- **Assigned Agent**: security-engineer
- **Component**: `server/imageService.ts`, `server/uploadService.ts`
- **Threat Vector**: Unvalidated user uploads could allow malicious file execution or denial of service through oversized blobs.
- **Recommended Remediation**: Verify magic byte validation (using `file-type` or native byte headers), enforce strict 10MB image and 500KB audio limits, and ensure storage keys are sanitized UUIDs.

---

### [SEC-002]: Client-Side Secrets & Environment Variable Sanitization
- **Severity**: Low
- **Status**: Verified / Clean
- **Assigned Agent**: security-engineer
- **Component**: `.env`, `vite.config.ts`
- **Audit Findings**: No hardcoded API secrets, payment private keys, or administrative passwords are leaked in client bundles. All public environment variables use `VITE_` prefix as required.

---

### [SEC-003]: Dependency Vulnerability Scan
- **Severity**: Informational
- **Status**: Monitoring
- **Assigned Agent**: security-engineer
- **Tool**: `npm audit`
- **Audit Findings**: Regular audit check scheduled in continuous engineering loop.
