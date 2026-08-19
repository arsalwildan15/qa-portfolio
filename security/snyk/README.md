# 🔐 SCA / SAST / Container — Snyk

Software Composition Analysis, Static Analysis, dan Container scanning terhadap OrangeHRM Open Source.

---

## Target

| Item | Detail |
|---|---|
| Repository | [github.com/orangehrm/orangehrm](https://github.com/orangehrm/orangehrm) (fork) |
| Docker Image | `orangehrm/orangehrm` |
| Tool | Snyk CLI |

---

## Cara Menjalankan

### Prasyarat

```bash
npm install -g snyk
snyk auth        # login dengan akun Snyk
```

### 1. SCA — Dependency Vulnerabilities

```bash
snyk test --json > results/snyk-sca.json
snyk test --html > results/snyk-sca.html
```

Mendeteksi CVE pada dependencies (Composer, npm, dll).

### 2. SAST — Code-Level Issues

```bash
snyk code test --json > results/snyk-sast.json
```

Mendeteksi kelemahan kode seperti SQL Injection, XSS, hardcoded secrets.

### 3. Container Scan — Docker Image

```bash
snyk container test orangehrm/orangehrm \
  --file=Dockerfile \
  --json > results/snyk-container.json
```

Mendeteksi CVE pada base image dan packages di dalam container.

---

## Scan Coverage

| Mode | Target | Output |
|---|---|---|
| SCA | Composer/npm deps | `snyk-sca.json` |
| SAST | PHP/JS source code | `snyk-sast.json` |
| Container | `orangehrm/orangehrm` image | `snyk-container.json` |

---

## Struktur Folder

```
snyk/
├── README.md
├── .snyk              ← Snyk policy (ignore rules jika ada)
└── results/
    ├── snyk-sca.json
    ├── snyk-sca.html
    ├── snyk-sast.json
    ├── snyk-container.json
    └── findings-summary.md
```

---

## Findings Summary Template

Setelah scan selesai, buat file `results/findings-summary.md`:

| # | Tipe | Severity | CVE / Issue | Package / File | Fix |
|---|---|---|---|---|---|
| 1 | SCA | Critical | CVE-XXXX-XXXX | vendor/xxx | Upgrade to vX.Y |
| 2 | SAST | High | SQL Injection | src/xxx.php:L42 | Use prepared statement |
| 3 | Container | High | CVE-XXXX-XXXX | libssl | Upgrade base image |

---

> 💡 Snyk policy file (`.snyk`) digunakan untuk mendokumentasikan accepted risks atau false positives yang sudah dianalisis dan diputuskan tidak perlu difix.
