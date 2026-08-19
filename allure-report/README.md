# 📊 Allure Report Setup

Allure Report digunakan untuk menampilkan hasil Playwright tests secara visual — dengan tagging Epic, Feature, Story, dan Severity otomatis.

---

## Setup Lokal

### Install Allure CLI

**Windows (Scoop):**
```powershell
scoop install allure
```

**macOS (Homebrew):**
```bash
brew install allure
```

**Linux:**
```bash
npm install -g allure-commandline
```

### Install allure-playwright

```bash
cd playwright
npm install allure-playwright
```

---

## Generate & Buka Report

```bash
# Generate report dari hasil test
npx allure generate playwright/allure-results --clean -o allure-report/output

# Buka di browser
npx allure open allure-report/output
```

Atau gunakan shortcut via npm script:

```bash
cd playwright
npm run report:generate
npm run report:open
```

---

## Tagging Otomatis

Fixture `fixtures/allure.fixture.ts` secara otomatis membaca **path file test** dan memetakannya ke:

| Tag | Diambil dari | Contoh |
|---|---|---|
| Epic | Folder level 1 | `tests/leave/` → **Leave** |
| Feature | Folder level 2 | `tests/leave/apply-leave/` → **Apply Leave** |
| Story | Nama file | `valid-flow.spec.ts` → **Valid Flow** |
| Severity | Nama Epic | `auth` → **Critical**, `leave` → **Normal** |

Tidak perlu menambahkan `allure.epic()` secara manual di setiap file spec.

---

## GitHub Pages (CI)

Allure Report di-deploy otomatis ke GitHub Pages setiap kali pipeline berjalan di branch `main`.

Akses report di: `https://{username}.github.io/{repo-name}/`
