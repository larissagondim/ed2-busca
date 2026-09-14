import { expect, test } from '@playwright/test'

test('período, detalhes, comparação e resumo sem overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Catálogo do dataset WikiArt.' })).toBeVisible()

  await page.getByLabel('Período').selectOption('barroco')
  await expect(page.getByText('ID 1 · Código B1')).toBeVisible()
  await expect(page.getByText('ID 0 · Código A1')).not.toBeVisible()
  await page.getByRole('button', { name: 'Ver detalhes' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar detalhes' }).click()

  await page.getByLabel('Tipo').selectOption('CODIGO')
  await page.getByRole('textbox', { name: 'Busca', exact: true }).fill('B1')
  await page.getByRole('button', { name: 'Comparar buscas' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(600)
  const scrollBeforeClose = await page.evaluate(() => window.scrollY)
  await page.getByRole('button', { name: 'Fechar detalhes' }).click()
  await expect(page.getByRole('heading', { name: 'Comparação das 8 buscas exatas' })).toBeVisible()
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(scrollBeforeClose)

  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('button', { name: 'Resumo' }).click()
  await expect(page.getByRole('heading', { name: 'Resumo das 8 buscas exatas' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
