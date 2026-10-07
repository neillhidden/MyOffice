const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PAGES_TEST_URL || 'http://127.0.0.1:4180/MyOffice/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(base);
    await page.getByRole('link', { name: 'Projetos e versões', exact: true }).click();
    await page.getByRole('heading', { name: 'Meus projetos', exact: true }).waitFor();
    if (await page.locator('article').count() !== 2) throw Error('Both projects must be visible');
    await page.getByRole('link', { name: 'Escolher projeto MyOffice', exact: true }).click();
    await page.getByRole('heading', { name: 'Versões do MyOffice', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Abrir versão', exact: true }).first().click();
    await page.waitForFunction(() => document.querySelector('#root')?.textContent.length > 100);
    await page.getByRole('link', { name: /Voltar às versões/ }).click();
    await page.getByRole('link', { name: 'Todos os projetos', exact: false }).click();
    await page.getByRole('link', { name: 'Escolher projeto BANCADA.az', exact: true }).click();
    await page.getByRole('heading', { name: 'Ainda não há versões disponíveis', exact: true }).waitFor();
    if (await page.getByRole('link', { name: 'Abrir versão', exact: true }).count()) throw Error('Empty project must not offer fake previews');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Mobile overflow');
    await page.getByRole('link', { name: 'Escolher outro projeto', exact: true }).click();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Hub overflow');
  }
  if (errors.length) throw Error(errors.join('\n'));
  console.log('Project selection, MyOffice preview, Bancada empty state and back navigation passed on desktop and mobile.');
} finally { await browser.close(); }
