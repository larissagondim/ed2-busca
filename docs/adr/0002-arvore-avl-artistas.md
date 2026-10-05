# ADR 0002: Árvore AVL para indexar os artistas

## Contexto

A avaliação exige ao menos uma estrutura linear e uma hierárquica, e pede **Lista com Saltos ou Árvore Afunilada**. O projeto só tinha estruturas lineares (listas encadeadas, vetor ordenado e Skip List). Faltava a hierárquica, e a aplicação tinha uma necessidade real que a Skip List por ID não atende: listar os artistas em ordem alfabética, paginados, saber a posição alfabética de cada um, achar as obras de um artista sem percorrer o catálogo (a busca por chave secundária era O(n) sobre 81.444 obras) e somar as visualizações por artista.

## Decisão

Adicionar `ArvoreAvlArtistas`: uma Árvore AVL cuja chave é o nome do artista normalizado (sem acentos, minúsculo) e cujo valor é a lista encadeada das obras dele. Duas modificações ligadas à aplicação:

1. **Estatística de ordem:** cada nó guarda o tamanho da subárvore, atualizado nas rotações. Com isso `artistaNaPosicao`, `posicaoDe` e `fatia` custam O(log n), o mesmo princípio das larguras da Skip List indexável aplicado a uma árvore.
2. **Visualizações agregadas:** cada nó soma as visualizações das obras do artista; `CatalogoService.visualizar` faz uma busca O(log n) e incrementa.

A Skip List continua sendo a estrutura do requisito "Lista com Saltos ou Árvore Afunilada". A AVL é a estrutura hierárquica.

## Atualização: a AVL também é uma das oito buscas

Para a estrutura hierárquica aparecer onde o usuário compara as estruturas (painel Buscar), a AVL passou a indexar também as obras por ID (`ArvoreAvlObras`), como a busca exata `ARVORE_AVL`, no lugar da busca de Fibonacci, que foi removida. A tela mostra comparações e a explicação passo a passo, agrupadas em "Árvore AVL". A AVL de artistas continua sendo a base da página Artistas.

## Por que uma árvore

A pergunta é por chave (artista) com ordem alfabética e posição: é o que uma estrutura hierárquica ordenada faz bem. A lista encadeada obriga a percorrer tudo, e a Skip List já indexa as obras por ID, código e título; os artistas formam outro índice, com muito menos chaves (1.119) e várias obras por chave.

## Por que AVL e não ABB

O CSV traz os artistas em ordem alfabética dentro de cada estilo, o pior caso de uma árvore binária de busca sem balanceamento. O `CatalogoService` constrói, só para comparação, uma ABB clássica (`ArvoreBuscaBinariaArtistas`, iterativa) com as mesmas chaves na mesma ordem. Resultado com os 81.444 registros e 1.119 artistas:

| | AVL | ABB |
|---|---:|---:|
| Altura (níveis) | 12 | 145 |
| Altura mínima possível (⌊log₂ 1119⌋ + 1) | 11 | 11 |
| Comparações médias de busca (todos os artistas) | 9,35 | 72,69 |

A AVL fica a um nível do mínimo; a ABB tem 12 vezes a altura e a busca média custa 7,8 vezes mais. A AVL precisou de 626 rotações (285 simples à esquerda, 91 simples à direita, 154 duplas esquerda-direita, 96 duplas direita-esquerda). Como são só 27 trechos ordenados, a ABB não degenera ao extremo (altura = n), mas já perde por uma ordem de grandeza; com inserção totalmente ordenada ela chega a altura n, o que `ArvoreAvlTest` verifica. Esses números aparecem na página Estruturas e em `GET /api/estruturas`.

## Por que não Árvore Afunilada (Splay)

O enunciado pede Skip List **ou** Splay, e o projeto já usa a Skip List como estrutura central, com a modificação das larguras. Implementar a Splay seria trabalho duplicado. A Splay também não serve a este caso: ela reorganiza a árvore a cada *leitura* (inclusive as de listagem e paginação), e as posições alfabéticas deveriam ser estáveis e as leituras sem efeito colateral. Uma AVL só muda na inserção e responde a `fatia` e `posicaoDe` sem alterar a estrutura.

## Consequências

- A busca por chave secundária ganha uma variante O(log n + k) (`CHAVE_SECUNDARIA_AVL`); a sequencial O(n) permanece como linha de base, e a consulta mostra as duas contagens lado a lado.
- A busca sequencial passou a comparar artistas com a mesma normalização da AVL (sem acentos, minúsculo), para as duas devolverem exatamente as mesmas obras.
- Memória extra: um nó por artista (1.119) e uma lista encadeada por artista, apontando para as mesmas `Obra`. Cada sessão de busca (`MotorDeBuscas`) constrói a sua AVL, como já constrói suas listas.
- A ABB existe apenas para métricas; a aplicação nunca a consulta.
