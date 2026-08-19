# 🔍 DAST — OWASP ZAP

Dynamic Application Security Testing (DAST) terhadap OrangeHRM yang di-deploy secara lokal via Docker.

---

## Target

| Item | Detail |
|---|---|
| Aplikasi | OrangeHRM Open Source |
| URL | `http://localhost:8080` |
| Mode | Authenticated + Unauthenticated |
| Tool | OWASP ZAP (Automation Framework) |

---

## Cara Menjalankan

### 1. Jalankan OrangeHRM via Docker

```bash
docker run -d -p 8080:80 --name orangehrm orangehrm/orangehrm
```

Tunggu hingga aplikasi siap, lalu akses `http://localhost:8080`.

### 2. Jalankan ZAP Scan

```bash
docker run --rm \
  --network="host" \
  -v $(pwd):/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-automation-framework.sh -I -af /zap/wrk/scan-config/automation.yaml
```

> Flag `-I` = ignore warnings (agar exit code tidak memblok CI).

### 3. Cek Hasil

Report akan tersimpan di folder `reports/`:
- `zap-report-orangehrm-auth.html` — laporan HTML lengkap
- `zap-report-orangehrm-auth.json` — data JSON untuk parsing CI

---

## Scan Coverage

| Jenis Scan | Metode | Status |
|---|---|---|
| Unauthenticated spider | ZAP Spider | ✅ |
| Authenticated spider | ZAP Spider + session | ✅ |
| AJAX Spider (SPA) | ZAP Ajax Spider | ✅ |
| Active Scan (authenticated) | ZAP Active Scan | ✅ |

---

## Struktur Folder

```
zap/
├── scan-config/
│   └── automation.yaml   ← Automation Framework config
└── reports/
    ├── zap-report-orangehrm-auth.html
    └── zap-report-orangehrm-auth.json
```

---

## Temuan & Metodologi

Setelah scan selesai, ringkasan temuan dicatat di `reports/findings-summary.md` dengan format:

| Alert | Risk | Confidence | Affected URL | Recommendation |
|---|---|---|---|---|
| ... | High | Medium | ... | ... |

> ⚠️ Scan hanya dilakukan pada instance lokal (localhost) — bukan pada production/staging pihak ketiga.
