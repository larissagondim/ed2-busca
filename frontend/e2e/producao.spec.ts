import { expect, test } from '@playwright/test'

test.skip(!process.env.WIKIART_E2E_AMOSTRA, 'Requer a API executando com a amostra de produção')

test('amostra: rotas, imagens, busca, detalhes e placeholder', async ({ page, request }) => {
  const catalogo = await request.get('/api/obras?size=24')
  expect(catalogo.ok()).toBe(true)
  const pagina = await catalogo.json()
  expect(pagina.totalElementos).toBe(540)
  const obra = pagina.conteudo[0]
  for (const rota of ['/', '/buscar', '/estruturas', '/acervo', '/museu', '/sobre', '/catalogo', '/resumo']) {
    await page.goto(rota)
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeAttached()
    expect(await page.locator('body').innerText()).not.toContain('Whitelabel Error')
  }
  for (const tipo of ['miniatura', 'original']) {
    const imagem = await request.get(`/api/imagens/${obra.id}/${tipo}`)
    expect(imagem.ok()).toBe(true)
    expect(imagem.headers()['content-type']).toContain('image/jpeg')
  }
  await page.goto('/acervo')
  const miniatura = page.locator('.art-image').first()
  await expect.poll(() => miniatura.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  await page.screenshot({ path: 'test-results/amostra-acervo.png', animations: 'disabled' })
  await page.getByRole('button', { name: 'Ver detalhes' }).first().click()
  await page.getByRole('button', { name: 'Ampliar imagem' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect.poll(() => page.locator('.drawer-image img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  await page.getByRole('button', { name: 'Fechar detalhes' }).click()
  await page.getByRole('button', { name: 'Buscar esta obra' }).first().click()
  await expect(page).toHaveURL(/\/buscar$/)
  await expect(page.getByRole('region', { name: 'Resultado das buscas' }).getByRole('row')).toHaveCount(10)
  await page.getByRole('button', { name: 'Comparar buscas' }).click()
  await expect.poll(async () => page.evaluate(async () => {
    const resumo = await (await fetch('/api/sessao/resumo')).json()
    return resumo.estrategias.map((item: { buscas: number }) => item.buscas)
  })).toEqual(Array(8).fill(2))
  await page.goto('/museu')
  await page.getByRole('button', { name: 'Entrar no museu' }).click()
  await expect.poll(() => page.locator('.museum-frame img').first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  await page.route('**/api/imagens/**', route => route.fulfill({ status: 404, body: 'Imagem indisponível' }))
  await page.goto('/acervo')
  await expect(page.locator('.art-image').first()).toHaveAttribute('src', '/imagem-indisponivel.svg')
  await expect(page.locator('.art-image').first()).toHaveJSProperty('naturalWidth', 480)
  await page.getByRole('button', { name: 'Ver detalhes' }).first().click()
  await page.getByRole('button', { name: 'Ampliar imagem' }).first().click()
  await expect(page.locator('.drawer-image img')).toHaveAttribute('src', '/imagem-indisponivel.svg')
  await page.screenshot({ path: 'test-results/amostra-placeholder.png', animations: 'disabled' })
  await page.getByRole('button', { name: 'Fechar detalhes' }).click()
  await page.goto('/museu')
  await page.getByRole('button', { name: 'Entrar no museu' }).click()
  await expect(page.locator('.museum-frame img').first()).toHaveAttribute('src', '/imagem-indisponivel.svg')
})
