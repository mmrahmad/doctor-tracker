/**
 * Captures desktop & mobile screenshots of every screen for the README.
 * Requires the API and web app to be running and the database seeded.
 *
 *   SCREENSHOT_EMAIL=... SCREENSHOT_PASSWORD=... pnpm --filter @doctor-tracker/web screenshots
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3100';
const email = process.env.SCREENSHOT_EMAIL ?? 'admin@doctortracker.dev';
const password = process.env.SCREENSHOT_PASSWORD ?? 'ChangeMe!2026';
const outputDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/screenshots');

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

async function capture(page, name, { fullPage = false } = {}) {
  await settle(page);
  await page.screenshot({ path: path.join(outputDirectory, `${name}.png`), fullPage });
  console.log(`  ✓ ${name}`);
}

async function captureViewport(browser, viewportName, colorScheme) {
  const context = await browser.newContext({ ...VIEWPORTS[viewportName], colorScheme });
  const page = await context.newPage();
  const prefix = `${viewportName}-${colorScheme}`;

  await page.goto(`${baseUrl}/login`);
  await capture(page, `${prefix}-login`);

  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await capture(page, `${prefix}-dashboard`, { fullPage: true });

  await page.goto(`${baseUrl}/doctors`);
  await capture(page, `${prefix}-doctors`, { fullPage: true });

  await page.getByRole('button', { name: 'Add doctor' }).first().click();
  await capture(page, `${prefix}-add-doctor`);
  await page.keyboard.press('Escape');

  await page.goto(`${baseUrl}/doctors?sortBy=patientCount`);
  await settle(page);
  await page.locator('a[href^="/doctors/"]:visible').first().click();
  await page.waitForURL('**/doctors/*');
  await capture(page, `${prefix}-doctor-detail`, { fullPage: true });

  await page.goto(`${baseUrl}/patients`);
  await capture(page, `${prefix}-patients`, { fullPage: true });

  await page.getByRole('button', { name: /^Edit / }).first().click();
  await capture(page, `${prefix}-edit-patient`);

  await context.close();
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
for (const [viewportName, colorScheme] of [
  ['desktop', 'light'],
  ['desktop', 'dark'],
  ['mobile', 'light'],
]) {
  console.log(`${viewportName} / ${colorScheme}`);
  await captureViewport(browser, viewportName, colorScheme);
}
await browser.close();
