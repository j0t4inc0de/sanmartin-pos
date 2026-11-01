import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SUITES = [
  {
    tier: 'Tier 1',
    name: 'Chilean Schedule Engine (10 Vectors)',
    file: 'tier1-schedule.test.mjs',
    milestone: 'M2',
  },
  {
    tier: 'Tier 1',
    name: 'CLP Currency Formatting (formatPriceCLP)',
    file: 'tier1-formatting.test.mjs',
    milestone: 'M2',
  },
  {
    tier: 'Tier 1',
    name: 'WhatsApp Order Builder & URL Encoding',
    file: 'tier1-whatsapp.test.mjs',
    milestone: 'M3',
  },
  {
    tier: 'Tier 2',
    name: 'Menu Categorization, Cart Extras & Combos Savings',
    file: 'tier2-menu-cart.test.mjs',
    milestone: 'M3',
  },
  {
    tier: 'Tier 3',
    name: 'Build Execution, Logo & Viewport CSS Integrity',
    file: 'tier3-build-visual.test.mjs',
    milestone: 'M1',
  },
  {
    tier: 'Tier 4',
    name: 'Adversarial XSS, Emojis, Quantities & Timezone Spoofing',
    file: 'tier4-adversarial.test.mjs',
    milestone: 'Final',
  },
];

console.log('='.repeat(80));
console.log(' FOOD TRUCK SANGUCHERÍA SAN MARTÍN — AUTOMATED E2E TEST RUNNER');
console.log('='.repeat(80));
console.log(`Project Root: ${PROJECT_ROOT}`);
console.log(`Node Version: ${process.version}`);
console.log(`Timestamp:    ${new Date().toISOString()}`);
console.log('-'.repeat(80));

let totalPassed = 0;
let totalFailed = 0;
let totalSuites = 0;
const escalations = [];

for (const suite of SUITES) {
  totalSuites++;
  const filePath = path.join(__dirname, suite.file);
  console.log(`\n▶ [${suite.tier}] Running: ${suite.name} (${suite.file})`);

  const startTime = Date.now();
  const proc = spawnSync('node', ['--test', filePath], {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
    env: process.env,
    timeout: 60000,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  const stdout = proc.stdout || '';
  const stderr = proc.stderr || '';

  // Parse TAP output lines
  const okLines = stdout.split('\n').filter((l) => /^\s*ok\s+\d+\s+-\s+/.test(l));
  const notOkLines = stdout.split('\n').filter((l) => /^\s*not\s+ok\s+\d+\s+-\s+/.test(l));

  const passedCount = okLines.length;
  const failedCount = notOkLines.length;

  totalPassed += passedCount;
  totalFailed += failedCount;

  if (proc.status === 0 && failedCount === 0) {
    console.log(`  ✔ PASSED: ${passedCount} tests passed in ${duration}s`);
  } else {
    console.log(`  ✖ FAILED: ${failedCount} failed, ${passedCount} passed in ${duration}s (Exit code: ${proc.status})`);
    for (const notOk of notOkLines) {
      console.log(`    ${notOk.trim()}`);
    }

    // Extract failure message / escalation
    const errorMatch = stdout.match(/error:\s*['"]?([^'\n\r]+)/);
    const errorMsg = errorMatch ? errorMatch[1] : (stderr || 'Test assertions failed');
    escalations.push({
      tier: suite.tier,
      suite: suite.name,
      file: suite.file,
      milestone: suite.milestone,
      failedTests: notOkLines.map((l) => l.trim()),
      error: errorMsg,
    });
  }
}

console.log('\n' + '='.repeat(80));
console.log(' TEST SUITE EXECUTION SUMMARY');
console.log('='.repeat(80));
console.log(`Suites Executed: ${totalSuites}`);
console.log(`Total Passed:    ${totalPassed}`);
console.log(`Total Failed:    ${totalFailed}`);
console.log(`Total Tests:     ${totalPassed + totalFailed}`);
console.log(`Success Rate:    ${(((totalPassed) / (totalPassed + totalFailed || 1)) * 100).toFixed(1)}%`);

if (escalations.length > 0) {
  console.log('\n' + '-'.repeat(80));
  console.log(' IMPLEMENTATION GAPS & DEFECT ESCALATIONS DETECTED');
  console.log('-'.repeat(80));
  for (const esc of escalations) {
    console.log(`\n• [${esc.tier}] Suite: ${esc.suite} (Milestone ${esc.milestone})`);
    console.log(`  File: tests/${esc.file}`);
    console.log(`  Identified Defect: ${esc.error}`);
    console.log(`  Failed Assertions:`);
    for (const t of esc.failedTests) {
      console.log(`    - ${t}`);
    }
  }
} else {
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}
console.log('='.repeat(80) + '\n');

// Exit with code 0 if all passed, or code 1 if failures exist
process.exit(totalFailed > 0 ? 1 : 0);
