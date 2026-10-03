import { expect, type Page, test } from '@playwright/test'

const semRolagemLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
async function irPeloMenu(page: Page, nome: string) {
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: nome }).click()
}

test('busca, estruturas, acervo e museu em páginas próprias, sem overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  // Início: busca rápida e o mapa das estruturas.
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Encontre uma obra. Compare as buscas.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'O que está por trás de cada busca' }).getByRole('heading', { level: 3 })).toHaveCount(4)
  await page.getByLabel('ID ou código da obra').fill('B1')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page).toHaveURL(/\/buscar$/)
  await expect(page.getByRole('heading', { name: 'Obra B1', level: 3 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Resultado das buscas' }).getByRole('row')).toHaveCount(10)
  expect(await semRolagemLateral(page)).toBe(true)

  // Buscar: só duas buscas, por código.
  await page.getByRole('button', { name: 'Desmarcar todas' }).click()
  await page.getByRole('button', { name: 'Binária' }).click()
  await page.getByRole('button', { name: 'Sequencial' }).click()
  await page.getByLabel('Tipo').selectOption('CODIGO')
  await page.getByRole('textbox', { name: 'Busca', exact: true }).fill('A1')
  await page.getByRole('button', { name: 'Comparar buscas' }).click()
  await expect(page.getByRole('heading', { name: 'Obra A1', level: 3 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Resultado das buscas' }).getByRole('row')).toHaveCount(3)
  await expect(page.getByRole('region', { name: 'Resumo da sessão' })).toContainText('2 obras no subconjunto')
  await expect(page.getByRole('list', { name: 'Melhor busca por estrutura' }).getByRole('listitem')).toHaveCount(2)

  // Outras consultas: a maior chave do catálogo de teste é a Obra B1.
  const consultas = page.getByRole('region', { name: 'Outras consultas' })
  await consultas.getByRole('radio', { name: 'Maior chave' }).click()
  await consultas.getByRole('button', { name: 'Consultar' }).click()
  await expect(consultas.getByRole('button', { name: /Abrir Obra B1/ })).toBeVisible()
  await page.getByRole('link', { name: 'Ver Busca binária passo a passo' }).click()
  await expect(page).toHaveURL(/\/estruturas\?busca=BINARIA#como-funciona$/)
  await expect(page.getByRole('tab', { name: /Binária/ })).toHaveAttribute('aria-selected', 'true')

  // Acervo: filtrar, virar e mandar a obra para a busca.
  await irPeloMenu(page, 'Acervo')
  await page.getByLabel('Período').selectOption('barroco')
  await expect(page.getByText('ID 1', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('ID 0', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver detalhes' }).click()
  await expect(page.getByText('Artista desconhecido', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ampliar imagem' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar detalhes' }).click()
  await page.getByRole('button', { name: 'Buscar esta obra' }).click()
  await expect(page).toHaveURL(/\/buscar$/)
  await expect(page.getByRole('textbox', { name: 'Busca', exact: true })).toHaveValue('1')
  expect(await semRolagemLateral(page)).toBe(true)

  // Início de novo: virar o cartão e buscar contam como visualização.
  await page.getByRole('link', { name: 'Catálogo WikiArt' }).click()
  await expect(page.getByRole('list', { name: 'Vistas recentemente' }).getByRole('button', { name: /Abrir Obra B1/ })).toBeAttached()
  await expect(page.getByRole('list', { name: 'Mais vistas' })).toContainText('Obra B1')

  // Estruturas: aberta direto pelo endereço (o SpaController devolve o index.html).
  await page.goto('/estruturas?busca=MOVER_PARA_INICIO')
  await expect(page.getByRole('heading', { name: 'Estruturas de dados', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Procurar 19, posição 4' }).click()
  await page.getByRole('button', { name: 'Reproduzir' }).click()
  await expect(page.getByRole('button', { name: 'Procurar 19, posição 1' })).toBeVisible({ timeout: 10_000 })
  expect(await semRolagemLateral(page)).toBe(true)

  // Sobre: alcançada pelo rodapé.
  await page.getByRole('contentinfo').getByRole('link', { name: 'Sobre o projeto' }).click()
  await expect(page.getByRole('heading', { name: 'Sobre o projeto', level: 1 })).toBeVisible()

  // Museu: entrar e andar entre salas.
  await irPeloMenu(page, 'Museu')
  await page.getByRole('button', { name: 'Entrar no museu' }).click()
  await expect(page.getByRole('heading', { name: 'Academic Art', level: 3 })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Obras da sala Academic Art' }).getByRole('button')).toHaveCount(1)
  await page.getByRole('button', { name: 'Próxima sala: Barroco' }).click()
  await expect(page.getByRole('heading', { name: 'Barroco', level: 3 })).toBeVisible()
  expect(await semRolagemLateral(page)).toBe(true)
})
