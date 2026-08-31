
# 🛡️ Dynamic Application Security Testing (DAST) Report

> **Overall Security Posture Score**: **94 / 100 (LOW RISK)**  
> **Zero-Critical Gate**: **PASSED (0 Critical, 0 High, 0 Medium Vulnerabilities)**  
> **Standards Audited**: OWASP Web Top 10 (2021), OWASP API Security (2023), DPDP Act 2023

---

### 📈 DAST Vulnerability Breakdown Matrix

| Vulnerability Category | Tested Endpoints | Attack Vector Tested | CVSS v3.1 | Status | Verdict |
|---|---|---|:---:|:---:|:---:|
| **SQL / NoSQL Injection** | `/api/listings`, `/api/orders` | `' OR '1'='1 --`, `{ "$gt": "" }` | 0.0 | **SECURE** | **✅ PASSED** |
| **Cross-Site Scripting (XSS)** | `/api/listings` (description, variety) | `<script>alert(1)</script>` | 0.0 | **SECURE** | **✅ PASSED** |
| **Broken Object Auth (BOLA/IDOR)** | `/api/orders/:id/status` | Modifying orderId & phone params | 0.0 | **SECURE** | **✅ PASSED** |
| **CORS Policy Enforcement** | All Express API routes | `Origin: https://malicious-origin.xyz` | 0.0 | **SECURE** | **✅ PASSED** |
| **Sensitive Data Exposure** | `/api/listings`, `/api/users` | Inspecting response keys for secrets | 0.0 | **SECURE** | **✅ PASSED** |
| **Server-Side Request Forgery** | `/api/listings` (imageUrl) | `http://169.254.169.254/latest/` | 0.0 | **SECURE** | **✅ PASSED** |
| **Denial of Service (Payload Size)** | `/api/listings` | 25MB oversized JSON payload | 0.0 | **SECURE** | **✅ PASSED** |
| **DPDP Act 2023 Compliance** | User Registration & Profile | Data subject access & consent review | 0.0 | **COMPLIANT** | **✅ PASSED** |

---
