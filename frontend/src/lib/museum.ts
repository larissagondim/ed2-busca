import type { Periodo } from '@/api'

export type Moldura = 'dourada' | 'madeira' | 'nenhuma'
export type Ala = { nome: string; parede: string; tinta: string; piso: string; moldura: Moldura }
export type Sala = Periodo & { titulo: string; epoca: string; texto: string; ala: Ala }

const ALAS = {
  renascimento: { nome: 'Ala do Renascimento', parede: '#5c2427', tinta: '#f6ece4', piso: '#3a2219', moldura: 'dourada' },
  barroco: { nome: 'Ala do Barroco e do Rococó', parede: '#1f3b31', tinta: '#eef2ea', piso: '#2e2117', moldura: 'dourada' },
  seculo19: { nome: 'Ala do século XIX', parede: '#1d2c48', tinta: '#eef1f7', piso: '#2b2420', moldura: 'dourada' },
  vanguardas: { nome: 'Ala das vanguardas', parede: '#3e3a36', tinta: '#f3efe9', piso: '#211d1a', moldura: 'madeira' },
  posGuerra: { nome: 'Ala do pós-guerra', parede: '#ecebe7', tinta: '#1d1d1b', piso: '#b9b6b0', moldura: 'nenhuma' },
  outras: { nome: 'Outras salas', parede: '#38424f', tinta: '#eef1f5', piso: '#23272d', moldura: 'madeira' },
} satisfies Record<string, Ala>

/** Ordem de visita: do Renascimento à arte contemporânea. */
const ROTEIRO: Array<[slug: string, titulo: string, epoca: string, ala: keyof typeof ALAS, texto: string]> = [
  ['early-renaissance', 'Primeiro Renascimento', 'c. 1400–1490', 'renascimento', 'A perspectiva linear e a redescoberta da Antiguidade em Florença.'],
  ['high-renaissance', 'Alto Renascimento', 'c. 1490–1527', 'renascimento', 'Equilíbrio e monumentalidade na geração de Leonardo, Rafael e Michelangelo.'],
  ['northern-renaissance', 'Renascimento do Norte', 'c. 1430–1580', 'renascimento', 'Detalhe minucioso e pintura a óleo em Flandres e na Alemanha.'],
  ['mannerism-late-renaissance', 'Maneirismo', 'c. 1520–1600', 'renascimento', 'Figuras alongadas e composições tensas depois do Alto Renascimento.'],
  ['baroque', 'Barroco', 'c. 1600–1750', 'barroco', 'Drama, movimento e contraste forte entre luz e sombra.'],
  ['rococo', 'Rococó', 'c. 1730–1780', 'barroco', 'Leveza, cores claras e cenas galantes da aristocracia.'],
  ['romanticism', 'Romantismo', 'c. 1800–1850', 'seculo19', 'Emoção, natureza sublime e imaginação acima da razão.'],
  ['realism', 'Realismo', 'c. 1840–1880', 'seculo19', 'A vida comum retratada sem idealização.'],
  ['ukiyo-e', 'Ukiyo-e', 'séc. XVII–XIX', 'seculo19', 'Xilogravuras japonesas do “mundo flutuante”, que marcaram os pintores europeus.'],
  ['impressionism', 'Impressionismo', 'c. 1860–1890', 'seculo19', 'Luz e instante captados com pinceladas soltas, muitas vezes ao ar livre.'],
  ['pointillism', 'Pontilhismo', 'c. 1886–1910', 'seculo19', 'Cor construída com pontos que se misturam no olhar de quem vê.'],
  ['post-impressionism', 'Pós-Impressionismo', 'c. 1886–1905', 'seculo19', 'Estrutura, cor expressiva e pinceladas pessoais depois do Impressionismo.'],
  ['symbolism', 'Simbolismo', 'c. 1880–1910', 'seculo19', 'Sonho, mito e mistério no lugar da descrição.'],
  ['art-nouveau-modern', 'Art Nouveau', 'c. 1890–1910', 'seculo19', 'Linhas orgânicas e ornamento inspirado na natureza.'],
  ['fauvism', 'Fauvismo', 'c. 1905–1910', 'vanguardas', 'Cor pura e arbitrária, aplicada com força.'],
  ['expressionism', 'Expressionismo', 'c. 1905–1930', 'vanguardas', 'Distorção e cor para expressar o mundo interior.'],
  ['naive-art-primitivism', 'Arte Naïf', 'séc. XIX–XX', 'vanguardas', 'Olhar direto e cores chapadas, fora da formação acadêmica.'],
  ['cubism', 'Cubismo', 'c. 1907–1920', 'vanguardas', 'O objeto visto de vários pontos de vista ao mesmo tempo.'],
  ['analytical-cubism', 'Cubismo Analítico', '1909–1912', 'vanguardas', 'Formas decompostas em facetas e paleta contida.'],
  ['synthetic-cubism', 'Cubismo Sintético', '1912–1919', 'vanguardas', 'Colagem, formas simples e a cor de volta à tela.'],
  ['abstract-expressionism', 'Expressionismo Abstrato', 'c. 1943–1965', 'posGuerra', 'Grandes gestos e campos de cor da Escola de Nova York.'],
  ['action-painting', 'Action Painting', 'c. 1947–1960', 'posGuerra', 'O próprio gesto de pintar registrado na tela.'],
  ['color-field-painting', 'Color Field', 'c. 1950–1970', 'posGuerra', 'Grandes áreas de cor plana, feitas para envolver quem olha.'],
  ['pop-art', 'Pop Art', 'c. 1955–1970', 'posGuerra', 'Imagens da publicidade e da cultura de massa.'],
  ['minimalism', 'Minimalismo', 'c. 1960–1975', 'posGuerra', 'O mínimo de forma, sem referência ao mundo.'],
  ['new-realism', 'Novo Realismo', 'c. 1960–1970', 'posGuerra', 'Objetos e materiais do cotidiano apropriados pela arte.'],
  ['contemporary-realism', 'Realismo Contemporâneo', 'c. 1970–hoje', 'posGuerra', 'Figuração precisa depois da abstração.'],
]

/** Monta as salas na ordem do roteiro; estilos fora dele entram no fim, em "Outras salas". */
export function montarSalas(periodos: Periodo[]): Sala[] {
  const posicao = new Map(ROTEIRO.map(([slug], index) => [slug, index]))
  return [...periodos]
    .sort((a, b) => (posicao.get(a.slug) ?? Infinity) - (posicao.get(b.slug) ?? Infinity) || a.nome.localeCompare(b.nome))
    .map(periodo => {
      const roteiro = ROTEIRO[posicao.get(periodo.slug) ?? -1]
      return roteiro
        ? { ...periodo, titulo: roteiro[1], epoca: roteiro[2], ala: ALAS[roteiro[3]], texto: roteiro[4] }
        : { ...periodo, titulo: periodo.nome, epoca: '', ala: ALAS.outras, texto: 'Obras do catálogo reunidas por estilo.' }
    })
}

/** Agrupa salas consecutivas da mesma ala, para a planta do museu. */
export function agruparPorAla(salas: Sala[]) {
  const grupos: Array<{ ala: Ala; salas: Array<{ sala: Sala; index: number }> }> = []
  salas.forEach((sala, index) => {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.ala === sala.ala) ultimo.salas.push({ sala, index })
    else grupos.push({ ala: sala.ala, salas: [{ sala, index }] })
  })
  return grupos
}

export const OBRAS_POR_PAREDE = 5
