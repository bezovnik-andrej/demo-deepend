/**
 * Captures screenshots of Norveo for the UX audit HTML document.
 * Requires: npm run dev (Vite on http://localhost:5175)
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'ux-audit-assets');

const BASE = 'http://localhost:5175';

/** Prefer system Chrome on macOS when Puppeteer's bundled browser isn't installed */
const CHROME_MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (existsSync(CHROME_MAC)) {
    launchOpts.executablePath = CHROME_MAC;
  }
  const browser = await puppeteer.launch(launchOpts);

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const shot = async (name, caption) => {
    const file = path.join(OUT, name);
    await page.screenshot({ path: file, type: 'png' });
    console.log('Saved:', file, caption ? `— ${caption}` : '');
  };

  try {
    await page.goto(`${BASE}/#/app`, { waitUntil: 'networkidle0', timeout: 60000 });
    await wait(500);
    await shot('01-template-picker.png', 'Template selection');

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Residential Standard'),
      );
      btn?.click();
    });
    await wait(200);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const start = btns.find((b) => b.textContent?.trim() === 'Start project');
      start?.click();
    });
    await wait(800);
    await shot('02-wizard-configuration.png', 'Configuration wizard with stepper');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const skip = btns.find((b) => b.textContent?.includes('Skip to workspace'));
      skip?.click();
    });
    await wait(800);
    // Skip opens config drawer by default — close for a clear view of the design shell
    await page.keyboard.press('Escape');
    await wait(400);
    await shot('03-design-workspace.png', 'Design workspace — title bar, activity bar, status bar');

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const eng = tabs.find((b) => b.textContent?.trim() === 'Engineering');
      eng?.click();
    });
    await wait(400);
    await shot('04-engineering-workspace.png', 'Engineering — Export PDF toolbar');

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const est = tabs.find((b) => b.textContent?.trim() === 'Estimate');
      est?.click();
    });
    await wait(400);
    await shot('05-estimate-workspace.png', 'Estimate — Save / Export toolbar');

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const bom = tabs.find((b) => b.textContent?.trim() === 'Bill of Materials');
      bom?.click();
    });
    await wait(400);
    await shot('06-bom-workspace.png', 'BOM — Export / Order Parts');

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const sum = tabs.find((b) => b.textContent?.trim() === 'Summary');
      sum?.click();
    });
    await wait(400);
    await shot('07-summary-workspace.png', 'Summary — hard-coded pool stats');

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const design = tabs.find((b) => b.textContent?.trim() === 'Design');
      design?.click();
    });
    await wait(400);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter((b) => {
        const r = b.getBoundingClientRect();
        return r.left < 56 && r.top > 42 && r.width > 0 && r.height > 0;
      });
      if (buttons.length >= 2) buttons[1].click();
    });
    await wait(400);
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const label = spans.find((s) => s.textContent?.trim() === 'Project Type');
      let el = label?.parentElement;
      while (el && !el.onclick && el !== document.body) {
        el = el.parentElement;
      }
      const row =
        label?.closest('div[class*="node"]') ||
        label?.closest('div') ||
        el;
      row?.click();
    });
    await wait(500);
    await shot('08-config-drawer.png', 'Configuration drawer overlay');

    await page.keyboard.press('Escape');
    await wait(300);

    await page.evaluate(() => {
      const bar = document.querySelector('[class*="ActivityBar"]') || document.body;
      const buttons = Array.from(bar.querySelectorAll('button'));
      const chatBtn = buttons[buttons.length - 1];
      chatBtn?.click();
    });
    await wait(600);
    await shot('09-ai-chat-panel.png', 'AI Assistant — markdown in messages');

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const design = tabs.find((b) => b.textContent?.trim() === 'Design');
      design?.click();
    });
    await wait(400);

    const canvasBox = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      if (!svg) return null;
      const r = svg.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (canvasBox) {
      await page.mouse.click(canvasBox.x, canvasBox.y, { button: 'right' });
      await wait(400);
      await shot('10-canvas-context-menu.png', 'Right-click Add to plan menu');
    }

    await page.keyboard.press('Escape');
    await wait(200);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
