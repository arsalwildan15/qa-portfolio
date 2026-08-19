import * as fs from 'fs';
import * as path from 'path';

const ALLURE_RESULTS_DIR = path.join(__dirname, 'allure-results');
const ENV_FILE = path.join(ALLURE_RESULTS_DIR, 'environment.properties');

export default async function globalTeardown() {
  fs.mkdirSync(ALLURE_RESULTS_DIR, { recursive: true });

  const lines = [
    'Browser=Chromium',
    'Base.URL=https://opensource-demo.orangehrmlive.com',
    'Framework=Playwright TypeScript',
    'OS=Windows 11',
    `Node.Version=${process.version}`,
    'Allure.Version=3.x',
  ];

  fs.writeFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf8');
  console.log('Allure environment.properties written to', ENV_FILE);
}
