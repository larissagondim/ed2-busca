export type Estrutura = 'lista' | 'tabela' | 'saltos' | 'arvore'

export type Estrategia = {
  tipo: string
  nome: string
  curto: string
  estrutura: Estrutura
  custo: string
  reorganiza: boolean
  descricao: string
}

/** Mesmas nove buscas e mesma ordem de SessaoBusca.TIPOS no backend. */
export const ESTRATEGIAS: Estrategia[] = [
  { tipo: 'SEQUENCIAL', nome: 'Busca sequencial simples', curto: 'Sequencial', estrutura: 'lista', custo: 'O(n)', reorganiza: false, descricao: 'Percorre a lista nó a nó, a partir do início, até achar a chave ou chegar ao fim. Não exige ordenação, mas no pior caso compara com todas as obras.' },
  { tipo: 'TRANSPOSICAO', nome: 'Busca sequencial com transposição', curto: 'Transposição', estrutura: 'lista', custo: 'O(n)', reorganiza: true, descricao: 'Igual à sequencial, mas ao encontrar a chave troca o nó com o vizinho anterior. Obras muito procuradas sobem uma posição por vez e ficam mais rápidas de achar.' },
  { tipo: 'MOVER_PARA_INICIO', nome: 'Busca sequencial com movimentação para o início', curto: 'Mover para o início', estrutura: 'lista', custo: 'O(n)', reorganiza: true, descricao: 'Igual à sequencial, mas leva o nó encontrado direto para o início da lista. Repetir a mesma busca logo em seguida custa uma única comparação.' },
  { tipo: 'BINARIA', nome: 'Busca binária', curto: 'Binária', estrutura: 'tabela', custo: 'O(log n)', reorganiza: false, descricao: 'Numa tabela ordenada, compara com o elemento do meio e descarta a metade que não pode conter a chave. Repete até achar ou o intervalo ficar vazio.' },
  { tipo: 'INTERPOLACAO', nome: 'Busca por interpolação', curto: 'Interpolação', estrutura: 'tabela', custo: 'O(log log n) com chaves uniformes', reorganiza: false, descricao: 'Em vez do meio, estima onde a chave deveria estar pela proporção entre os extremos do intervalo, como quem abre um dicionário perto da letra certa.' },
  { tipo: 'LISTA_COM_SALTOS', nome: 'Busca em lista com saltos (Skip List)', curto: 'Lista com saltos', estrutura: 'saltos', custo: 'O(log n) esperado', reorganiza: false, descricao: 'Uma lista ordenada com níveis expressos por cima. Avança pelo nível mais alto enquanto o próximo nó é menor que a chave e desce um nível quando passaria dela.' },
  { tipo: 'FIBONACCI', nome: 'Busca de Fibonacci', curto: 'Fibonacci', estrutura: 'tabela', custo: 'O(log n)', reorganiza: false, descricao: 'Divide a tabela ordenada usando números de Fibonacci em vez de metades. As posições testadas saem só de somas e subtrações, sem divisão.' },
  { tipo: 'DEDILHADA', nome: 'Busca dedilhada', curto: 'Dedilhada', estrutura: 'lista', custo: 'O(n), rápida para chaves próximas', reorganiza: false, descricao: 'Mantém um "dedo" no último nó encontrado e começa a próxima busca dali, dando a volta pelo início se precisar. Buscas seguidas por chaves vizinhas ficam baratas.' },
  { tipo: 'ARVORE_AFUNILADA', nome: 'Busca em árvore afunilada (Splay)', curto: 'Árvore afunilada', estrutura: 'arvore', custo: 'O(log n) amortizado', reorganiza: true, descricao: 'Desce pela árvore binária de busca e, ao achar a chave, leva o nó até a raiz com rotações zig, zig-zig e zig-zag. Uma obra procurada de novo está no topo. No catálogo, a árvore já começa balanceada para evitar a primeira busca em O(n).' },
]

export const TODAS = ESTRATEGIAS.map(item => item.tipo)

export type Entrada = 'nenhuma' | 'id' | 'intervalo' | 'artista'
export type Consulta = { tipo: string; curto: string; estrutura: Estrutura; entrada: Entrada; descricao: string }

/** As seis consultas que não procuram uma chave exata (mesma ordem de SessaoBusca.CONSULTAS). */
export const CONSULTAS: Consulta[] = [
  { tipo: 'CHAVE_SECUNDARIA', curto: 'Por artista', estrutura: 'lista', entrada: 'artista', descricao: 'Percorre a lista inteira e devolve todas as obras do artista. A chave é secundária: várias obras podem ter o mesmo valor.' },
  { tipo: 'PISO', curto: 'Piso', estrutura: 'tabela', entrada: 'id', descricao: 'Devolve a obra de maior ID menor ou igual ao informado. Útil quando o ID exato não existe.' },
  { tipo: 'TETO', curto: 'Teto', estrutura: 'tabela', entrada: 'id', descricao: 'Devolve a obra de menor ID maior ou igual ao informado.' },
  { tipo: 'INTERVALO', curto: 'Intervalo', estrutura: 'tabela', entrada: 'intervalo', descricao: 'Acha os dois limites por busca binária e devolve todas as obras entre eles.' },
  { tipo: 'MENOR_CHAVE', curto: 'Menor chave', estrutura: 'lista', entrada: 'nenhuma', descricao: 'Percorre a lista sem chave de busca e devolve a obra de menor ID.' },
  { tipo: 'MAIOR_CHAVE', curto: 'Maior chave', estrutura: 'lista', entrada: 'nenhuma', descricao: 'Percorre a lista sem chave de busca e devolve a obra de maior ID.' },
]
