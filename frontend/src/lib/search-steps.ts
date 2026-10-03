/**
 * Simulações passo a passo das oito buscas exatas para a seção explicativa.
 * Cada função espelha o algoritmo Java correspondente, inclusive a contagem
 * de comparações, para que a animação conte a mesma história que a API.
 */

export type Step = {
  /** Posição comparada neste passo (na ordem exibida). */
  probe: number | null
  comparisons: number
  note: string
  /** Intervalo ainda possível nas buscas em tabela. */
  low?: number
  high?: number
  /** Nível e nó atual da lista com saltos. */
  level?: number
  cursor?: number
  /** Ordem da lista após uma reorganização. */
  order?: number[]
  finger?: number | null
  /** Posições da lista já comparadas sem sucesso. */
  visited?: number[]
  result?: 'found' | 'missing'
  /** Forma da árvore afunilada neste passo e rotações feitas até aqui. */
  tree?: Tree
  rotations?: number
}

/** Árvore sobre as posições de KEYS: filhos por índice, -1 indica vazio. */
export type Tree = { root: number; left: number[]; right: number[] }

export type Run = { steps: Step[]; order?: number[]; finger?: number | null; tree?: Tree }

export const KEYS = [3, 8, 11, 19, 24, 31, 38, 46, 57, 63, 78, 92]
/** Altura de cada nó da lista com saltos (fixa para a animação ser reproduzível). */
export const HEIGHTS = [1, 2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1]
export const MISSING_KEY = 50

const relation = (value: number, target: number) => value === target ? '=' : value < target ? '<' : '>'

function scan(order: number[], target: number, start: number, wrap: boolean, finger?: number | null) {
  const steps: Step[] = []
  const indexes = wrap ? [...order.keys()].slice(start).concat([...order.keys()].slice(0, start)) : [...order.keys()]
  let comparisons = 0
  const visited: number[] = []
  for (const index of indexes) {
    comparisons++
    const found = order[index] === target
    steps.push({ probe: index, comparisons, finger, visited: [...visited], note: found ? `${order[index]} = ${target}: encontrada na posição ${index + 1}.` : `${order[index]} ≠ ${target}: segue para o próximo nó.`, result: found ? 'found' : undefined })
    if (found) return { steps, index }
    visited.push(index)
  }
  steps.push({ probe: null, comparisons, finger, visited, note: `Fim da lista após ${comparisons} comparações: ${target} não está no catálogo.`, result: 'missing' })
  return { steps, index: -1 }
}

export function sequencial(order: number[], target: number): Run {
  return { steps: scan(order, target, 0, false).steps }
}

export function transposicao(order: number[], target: number): Run {
  const { steps, index } = scan(order, target, 0, false)
  if (index <= 0) return { steps, order }
  const next = [...order];[next[index - 1], next[index]] = [next[index], next[index - 1]]
  const last = steps[steps.length - 1]
  steps.push({ ...last, probe: index - 1, visited: [], order: next, note: `Troca ${target} com o vizinho anterior: agora ela está na posição ${index}.` })
  return { steps, order: next }
}

export function moverParaInicio(order: number[], target: number): Run {
  const { steps, index } = scan(order, target, 0, false)
  if (index <= 0) return { steps, order }
  const next = [target, ...order.slice(0, index), ...order.slice(index + 1)]
  const last = steps[steps.length - 1]
  steps.push({ ...last, probe: 0, visited: [], order: next, note: `Move ${target} para o início: a próxima busca por ela custa 1 comparação.` })
  return { steps, order: next }
}

export function dedilhada(order: number[], target: number, finger: number | null): Run {
  const start = finger ?? 0
  const { steps, index } = scan(order, target, start, true, finger)
  steps.unshift({ probe: null, comparisons: 0, finger, note: finger === null ? 'Sem dedo ainda: começa pelo início da lista.' : `O dedo está em ${order[start]}, o último acerto: começa dali.` })
  if (index < 0) return { steps, finger }
  steps[steps.length - 1] = { ...steps[steps.length - 1], finger: index, note: `${target} encontrada. O dedo passa a apontar para ela.` }
  return { steps, finger: index }
}

export function binaria(keys: number[], target: number): Run {
  const steps: Step[] = []
  let low = 0, high = keys.length - 1, comparisons = 0
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2)
    comparisons++
    const value = keys[mid]
    if (value === target) { steps.push({ probe: mid, low, high, comparisons, note: `Meio do intervalo: ${value} = ${target}. Encontrada.`, result: 'found' }); return { steps } }
    steps.push({ probe: mid, low, high, comparisons, note: `Meio do intervalo: ${value} ${relation(value, target)} ${target}, descarta a metade ${value < target ? 'da esquerda' : 'da direita'}.` })
    if (value < target) low = mid + 1; else high = mid - 1
  }
  steps.push({ probe: null, low, high, comparisons, note: `Intervalo vazio após ${comparisons} comparações: ${target} não está no catálogo.`, result: 'missing' })
  return { steps }
}

export function interpolacao(keys: number[], target: number): Run {
  const steps: Step[] = []
  let low = 0, high = keys.length - 1, comparisons = 0
  while (low <= high && keys.length > 0) {
    const min = keys[low], max = keys[high]
    if (target < min || target > max) { comparisons++; break }
    if (min === max) {
      comparisons++
      steps.push({ probe: low, low, high, comparisons, note: `Sobrou uma chave: ${min} ${relation(min, target)} ${target}.`, result: min === target ? 'found' : 'missing' })
      return { steps }
    }
    const position = low + Math.trunc((high - low) * ((target - min) / (max - min)))
    const value = keys[position]
    comparisons++
    const estimate = `Estimativa: ${low} + (${high} − ${low}) × (${target} − ${min}) / (${max} − ${min}) ≈ posição ${position + 1}.`
    if (value === target) { steps.push({ probe: position, low, high, comparisons, note: `${estimate} ${value} = ${target}. Encontrada.`, result: 'found' }); return { steps } }
    steps.push({ probe: position, low, high, comparisons, note: `${estimate} ${value} ${relation(value, target)} ${target}.` })
    if (value < target) low = position + 1; else high = position - 1
  }
  steps.push({ probe: null, low, high, comparisons, note: `${target} fica fora do intervalo restante: não está no catálogo (${comparisons} comparações).`, result: 'missing' })
  return { steps }
}

export function fibonacci(keys: number[], target: number): Run {
  const steps: Step[] = []
  const n = keys.length
  let f2 = 0, f1 = 1, f = f1
  while (f < n) { f2 = f1; f1 = f; f = f1 + f2 }
  let offset = -1, comparisons = 0
  while (f > 1) {
    const index = Math.min(offset + f2, n - 1)
    const value = keys[index]
    comparisons++
    const window = { low: offset + 1, high: Math.min(offset + f, n - 1) }
    const prefix = `F = ${f} (${f1} + ${f2}): testa a posição ${offset + 1} + ${f2} → ${index + 1}.`
    if (value === target) { steps.push({ probe: index, ...window, comparisons, note: `${prefix} ${value} = ${target}. Encontrada.`, result: 'found' }); return { steps } }
    steps.push({ probe: index, ...window, comparisons, note: `${prefix} ${value} ${relation(value, target)} ${target}, ${value < target ? 'avança um Fibonacci' : 'recua dois Fibonacci'}.` })
    if (value < target) { f = f1; f1 = f2; f2 = f - f1; offset = index } else { f = f2; f1 = f1 - f2; f2 = f - f1 }
  }
  if (f1 === 1 && offset + 1 < n) {
    comparisons++
    const found = keys[offset + 1] === target
    steps.push({ probe: offset + 1, low: offset + 1, high: offset + 1, comparisons, note: `Última candidata: ${keys[offset + 1]} ${relation(keys[offset + 1], target)} ${target}.${found ? ' Encontrada.' : ''}`, result: found ? 'found' : undefined })
    if (found) return { steps }
  }
  steps.push({ probe: null, comparisons, note: `Sem candidatas após ${comparisons} comparações: ${target} não está no catálogo.`, result: 'missing' })
  return { steps }
}

export function listaComSaltos(keys: number[], heights: number[], target: number): Run {
  const steps: Step[] = []
  const next = (from: number, level: number) => { for (let index = from + 1; index < keys.length; index++) if (heights[index] > level) return index; return -1 }
  let cursor = -1, comparisons = 0
  for (let level = Math.max(...heights) - 1; level >= 0; level--) {
    for (let candidate = next(cursor, level); candidate >= 0; candidate = next(cursor, level)) {
      comparisons++
      const value = keys[candidate]
      const stop = value >= target
      steps.push({ probe: candidate, level, cursor, comparisons, note: `Nível ${level + 1}: o próximo é ${value} ${relation(value, target)} ${target}, ${stop ? (level > 0 ? 'desce um nível.' : 'para no nível base.') : 'avança.'}` })
      if (stop) break
      cursor = candidate
    }
  }
  const final = next(cursor, 0)
  if (final >= 0) {
    comparisons++
    const found = keys[final] === target
    steps.push({ probe: final, level: 0, cursor, comparisons, note: found ? `No nível base, ${keys[final]} = ${target}. Encontrada.` : `No nível base, ${keys[final]} ≠ ${target}: não está no catálogo.`, result: found ? 'found' : 'missing' })
  } else steps.push({ probe: null, level: 0, cursor, comparisons, note: `Fim da lista: ${target} não está no catálogo.`, result: 'missing' })
  return { steps }
}

/** Igual a ArvoreAfunilada.deOrdenados: o meio de cada intervalo vira a raiz da subárvore. */
export function arvoreBalanceada(n = KEYS.length): Tree {
  const left = Array<number>(n).fill(-1), right = Array<number>(n).fill(-1)
  const build = (low: number, high: number): number => {
    if (low > high) return -1
    const mid = (low + high) >>> 1
    left[mid] = build(low, mid - 1); right[mid] = build(mid + 1, high)
    return mid
  }
  return { root: build(0, n - 1), left, right }
}

/** Profundidade de cada posição; a raiz tem profundidade 0. */
export function profundidades(tree: Tree): number[] {
  const depth = Array<number>(tree.left.length).fill(0)
  const queue = tree.root >= 0 ? [tree.root] : []
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head]
    for (const child of [tree.left[node], tree.right[node]]) if (child >= 0) { depth[child] = depth[node] + 1; queue.push(child) }
  }
  return depth
}

/** Espelha ArvoreAfunilada.acessar: desce comparando e afunila o nó achado (ou o último visitado). */
export function arvoreAfunilada(initial: Tree, keys: number[], target: number): Run {
  const tree: Tree = { root: initial.root, left: [...initial.left], right: [...initial.right] }
  const parent = Array<number>(keys.length).fill(-1)
  tree.left.forEach((child, node) => { if (child >= 0) parent[child] = node })
  tree.right.forEach((child, node) => { if (child >= 0) parent[child] = node })
  const snapshot = (): Tree => ({ root: tree.root, left: [...tree.left], right: [...tree.right] })
  const steps: Step[] = []
  let node = tree.root, last = -1, found = -1, comparisons = 0, rotations = 0
  while (node >= 0) {
    comparisons++; last = node
    const value = keys[node]
    if (value === target) { found = node; steps.push({ probe: node, comparisons, rotations, tree: snapshot(), note: `${value} = ${target}: encontrada${node === tree.root ? ' já na raiz, sem rotações.' : '. Agora ela sobe até a raiz.'}`, result: 'found' }); break }
    steps.push({ probe: node, comparisons, rotations, tree: snapshot(), note: `${value} ${relation(value, target)} ${target}: desce para a ${value > target ? 'esquerda' : 'direita'}.` })
    node = value > target ? tree.left[node] : tree.right[node]
  }
  const result = found >= 0 ? 'found' : 'missing'
  if (found < 0) steps.push({ probe: last, comparisons, rotations, tree: snapshot(), note: `Filho vazio: ${target} não está no catálogo. Como no algoritmo clássico, o último nó visitado (${keys[last]}) sobe até a raiz.`, result })
  const rotate = (x: number) => {
    const p = parent[x], g = parent[p]
    if (tree.left[p] === x) { tree.left[p] = tree.right[x]; if (tree.right[x] >= 0) parent[tree.right[x]] = p; tree.right[x] = p }
    else { tree.right[p] = tree.left[x]; if (tree.left[x] >= 0) parent[tree.left[x]] = p; tree.left[x] = p }
    parent[p] = x; parent[x] = g
    if (g < 0) tree.root = x; else if (tree.left[g] === p) tree.left[g] = x; else tree.right[g] = x
    rotations++
  }
  const x = found >= 0 ? found : last
  while (parent[x] >= 0) {
    const p = parent[x], g = parent[p]
    let move: string
    if (g < 0) { rotate(x); move = `Zig: ${keys[x]} troca de lugar com o pai ${keys[p]} e vira a raiz` }
    else if ((tree.left[p] === x) === (tree.left[g] === p)) { rotate(p); rotate(x); move = `Zig-zig: ${keys[x]}, o pai ${keys[p]} e o avô ${keys[g]} estão alinhados; rotaciona primeiro o pai, depois o nó` }
    else { rotate(x); rotate(x); move = `Zig-zag: ${keys[x]} faz um cotovelo com o pai ${keys[p]} e o avô ${keys[g]}; sobe duas vezes seguidas` }
    steps.push({ probe: x, comparisons, rotations, tree: snapshot(), note: `${move}. ${rotations} ${rotations === 1 ? 'rotação' : 'rotações'} até agora.`, result })
  }
  return { steps, tree: snapshot() }
}

export type ListState = { order: number[]; finger: number | null; tree?: Tree }

export function simulate(tipo: string, target: number, state: ListState): Run {
  switch (tipo) {
    case 'SEQUENCIAL': return sequencial(state.order, target)
    case 'TRANSPOSICAO': return transposicao(state.order, target)
    case 'MOVER_PARA_INICIO': return moverParaInicio(state.order, target)
    case 'DEDILHADA': return dedilhada(state.order, target, state.finger)
    case 'BINARIA': return binaria(KEYS, target)
    case 'INTERPOLACAO': return interpolacao(KEYS, target)
    case 'FIBONACCI': return fibonacci(KEYS, target)
    case 'ARVORE_AFUNILADA': return arvoreAfunilada(state.tree ?? arvoreBalanceada(), KEYS, target)
    default: return listaComSaltos(KEYS, HEIGHTS, target)
  }
}

/** Alturas reproduzíveis para n nós (1, 2, 1, 3, 1, 2, 1, 4…), como uma régua. */
export function alturas(n: number, maximo = 4): number[] {
  return Array.from({ length: n }, (_, index) => Math.min(maximo, 1 + Math.log2((index + 1) & -(index + 1))))
}

/** Igual a simulate, mas sobre chaves quaisquer (as obras de uma sala do museu). */
export function simularEm(tipo: string, keys: number[], target: number, state: ListState): Run {
  switch (tipo) {
    case 'SEQUENCIAL': return sequencial(state.order, target)
    case 'TRANSPOSICAO': return transposicao(state.order, target)
    case 'MOVER_PARA_INICIO': return moverParaInicio(state.order, target)
    case 'DEDILHADA': return dedilhada(state.order, target, state.finger)
    case 'BINARIA': return binaria(keys, target)
    case 'INTERPOLACAO': return interpolacao(keys, target)
    case 'FIBONACCI': return fibonacci(keys, target)
    case 'ARVORE_AFUNILADA': return arvoreAfunilada(state.tree ?? arvoreBalanceada(keys.length), keys, target)
    default: return listaComSaltos(keys, alturas(keys.length), target)
  }
}
