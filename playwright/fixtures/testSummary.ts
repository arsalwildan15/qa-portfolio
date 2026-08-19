// Shared helper for printing a structured, human-readable summary block to
// the console at the end of every test — one place to keep the exact format
// consistent across all 40 login specs and the leave specs, instead of
// copy-pasting the same ~10 print lines into every file.

export interface CheckResult {
  label: string;
  ok: boolean;
  detail?: string;
}

/** Prints a "====...TC-ID | name...====  ✓/✗ check → detail ... STATUS: PASSED/FAILED" block. */
export function printTcSummary(tcId: string, tcName: string, checks: CheckResult[]) {
  const passed = checks.every((c) => c.ok);
  const line = '============================================================';

  console.log(line);
  console.log(`${tcId} | ${tcName}`);
  console.log(line);
  checks.forEach((c) => {
    const icon = c.ok ? '✓' : '✗';
    const detail = c.detail ? ` → ${c.detail}` : '';
    console.log(`  ${icon} ${c.label}${detail}`);
  });
  console.log(line);
  console.log(`STATUS: ${passed ? 'PASSED' : 'FAILED'}`);
  console.log(line);
}
