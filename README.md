# 🧪 QA Portfolio — Arsal Wildan Naviaddin

> Software QA Engineer | Functional Testing · Security Testing · CI/CD

[![Playwright](https://img.shields.io/badge/Playwright-TypeScript-blue?logo=playwright)](./playwright)
[![Allure](https://img.shields.io/badge/Allure-Report-orange)](./allure-report)
[![ZAP](https://img.shields.io/badge/OWASP-ZAP-red)](./security/zap)
[![Snyk](https://img.shields.io/badge/Snyk-Security-purple)](./security/snyk)
[![Allure Report](https://img.shields.io/badge/Allure-Live%20Report-orange)](https://arsalwildan15.github.io/qa-portfolio/)

---

## 📋 Overview

This portfolio demonstrates a **full testing lifecycle** applied to a single target application — [OrangeHRM Open Source](https://opensource-demo.orangehrmlive.com) — covering functional automation, security scanning, and test reporting.

| Layer | Tool | Target |
|---|---|---|
| E2E Functional Testing | Playwright (TypeScript) | OrangeHRM (self-hosted via Docker) |
| Test Reporting | Allure Report | Playwright test results |
| DAST / Penetration | OWASP ZAP | OrangeHRM (localhost:8080) |
| SCA / SAST / Container | Snyk | OrangeHRM repository + Docker image |

---

## 🗂️ Repository Structure

```
qa-portfolio/
├── playwright/               # E2E automation with Playwright
│   ├── tests/                # Test specs per module
│   ├── pages/                # Page Object Models
│   ├── fixtures/             # Allure auto-annotation fixture
│   └── playwright.config.ts
│
├── allure-report/            # Allure setup & report guide
│
├── security/
│   ├── zap/                  # OWASP ZAP DAST scans
│   │   ├── scan-config/      # Automation Framework YAML
│   │   └── reports/          # HTML scan reports
│   └── snyk/                 # Snyk SCA, SAST, Container
│       └── results/          # Scan output (JSON/HTML)
│
└── .github/workflows/        # CI/CD pipeline
```

---

## 🚀 Quick Start

### 1. Run Playwright Tests

```bash
cd playwright
npm install
npx playwright test
```

### 2. Open Allure Report

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### 3. Run ZAP Scan (requires Docker)

```bash
# Start OrangeHRM locally
docker run -d -p 8080:80 --name orangehrm orangehrm/orangehrm

# Run ZAP scan
docker run -v $(pwd)/security/zap:/zap/wrk ghcr.io/zaproxy/zaproxy:stable \
  zap-automation-framework.sh -I -af /zap/wrk/scan-config/automation.yaml
```

### 4. Run Snyk Scan

```bash
# SCA — dependency vulnerabilities
snyk test --json > security/snyk/results/snyk-sca.json

# SAST — code-level issues
snyk code test --json > security/snyk/results/snyk-sast.json

# Container scan
snyk container test orangehrm/orangehrm --json > security/snyk/results/snyk-container.json
```

---

## 📊 Test Coverage (Playwright)

| Module | Test Cases | Status |
|---|---|---|
| Authentication (Login/Logout) | 10 | ✅ Done |
| Leave Management | 15 | ✅ Done |
| Recruitment | 12 | ✅ Done |
| PIM (Personal Info) | 10 | ✅ Done |

---

## 🔐 Security Findings Summary

> See [`security/zap/reports/`](./security/zap/reports/) and [`security/snyk/results/`](./security/snyk/results/) for full reports.

| Tool | Type | Findings | Critical | High |
|---|---|---|---|---|
| OWASP ZAP | DAST | See report | - | - |
| Snyk SCA | Dependency CVEs | See report | - | - |
| Snyk SAST | Code issues | See report | - | - |
| Snyk Container | Image CVEs | See report | - | - |

---

## 🛠️ Tech Stack

- **Language:** TypeScript, JavaScript
- **Functional:** Playwright, Page Object Model (POM)
- **Reporting:** Allure Report (with Epic/Feature/Story tagging)
- **Security:** OWASP ZAP (DAST), Snyk (SCA/SAST/Container)
- **CI/CD:** GitHub Actions
- **Target App:** OrangeHRM Open Source (Docker)

---

## 📬 Contact

**Arsal Wildan Naviaddin**
- 📧 [arsalwildan@gmail.com](mailto:arsalwildan@gmail.com)
- 💼 [linkedin.com/in/arsalwildan](https://linkedin.com/in/arsalwildan)
- 🐙 [github.com/arsalwildan15](https://github.com/arsalwildan15)
- 📊 [Live Allure Report](https://arsalwildan15.github.io/qa-portfolio/)
