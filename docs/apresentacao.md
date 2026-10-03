# Roteiro da apresentação e do vídeo

## Apresentação (cerca de 10 minutos)

O foco pedido no enunciado é a organização do projeto e as estruturas de dados.

| # | Slide | Conteúdo | Onde mostrar no código |
|---|---|---|---|
| 1 | A aplicação | Catálogo WikiArt com 81.444 obras e 27 estilos. Web + CLI. | Tela inicial |
| 2 | Regras do trabalho | Tabela "regra → como cumprimos" (seção 2 do `relatorio.md`) | — |
| 3 | Organização | Pacotes `structure` (estruturas), `search` (algoritmos), `service` (uso), `web`/`app` (interfaces) | Árvore de pastas |
| 4 | Como o catálogo é guardado | Diagrama da seção 2 do relatório: Skip Lists, árvore por ID, árvore de estilos, ranking | `CatalogoService` |
| 5 | Árvore Afunilada | Zig, zig-zig e zig-zag; desenho de um afunilamento | `ArvoreAfunilada.afunilar` |
| 6 | Modificação: carga balanceada | Inserção crescente gera altura 81.444; carga balanceada gera altura 17 | `deOrdenados`, teste `cargaEmLoteBalanceiaAArvore` |
| 7 | Modificação: consultar × acessar e "recentes" | Miniaturas não afunilam; recentes = percurso em largura no topo | `consultar`, `recentes` |
| 8 | Skip List indexável | Desenho com as larguras nos ponteiros; `obter(i)` somando larguras | `ListaComSaltos.inserir/obter` |
| 9 | Paginação antes e depois | Antes ordenava tudo a cada página (O(n log n)); agora um salto, O(log n) | `ApiController.obras` |
| 10 | Mais vistas | Transposição clássica × transposição guardada, com exemplo de 3 obras | `ListaMaisVistas.registrar` |
| 11 | Comparação das 9 buscas | Tabela com o ID 70.000: sequencial 70.001, binária 16, Skip List 31, Splay 16 (com 15 rotações) e 1 na segunda busca | Tela "Comparação" |
| 12 | Processo e testes | Etapas, CI, uso de LLM | `relatorio.md` seção 4 |

### Perguntas prováveis (para preparar)

- **Por que a árvore afunilada e não uma AVL?**
  - Os acessos do usuário não são uniformes: ele reabre obras que acabou de ver. A Splay se adapta a isso em O(log n) amortizado e ainda dá o histórico de recentes de graça.
  - A AVL não tem essa memória de acesso.
- **A carga balanceada não "quebra" a Splay?**
  - Não. A Splay aceita qualquer formato inicial, e a análise amortizada continua valendo.
  - Só evitamos o pior formato inicial possível.
- **Os "recentes" são exatos?**
  - O mais recente é sempre exato, porque é a raiz.
  - Os demais saem por profundidade, que acompanha a ordem de acesso. Depois de muitos acessos, os antigos descem além de 8 níveis e somem da lista, que é o comportamento desejado.
- **Por que a Skip List e não um vetor ordenado para paginar?**
  - O vetor também daria acesso por posição.
  - A Skip List aceita inserção em O(log n) sem deslocar elementos, e o próprio enunciado exige Skip List ou Splay.
  - A largura nos ponteiros é o que a torna indexável.
- **Onde ainda aparece `java.util.List`?**
  - Só para devolver resultados à interface (JSON). Nenhuma busca, índice ou ordenação do catálogo usa coleções da biblioteca.
  - O vetor ordenado usa `Arrays.sort` uma única vez, na construção.

## Vídeo (3 a 5 minutos)

1. Rodar `java -jar target/wikiart-catalogo-1.0.0-SNAPSHOT.jar` e mostrar o log "Started" com o catálogo carregado.
2. Abrir `http://localhost:8080`, mostrar a grade e trocar o estilo para **Baroque**.
3. Ir para uma página alta, como a 100, e comentar que ela vem da Skip List indexável.
4. Abrir três obras diferentes e mostrar **Vistas recentemente** sendo atualizada, com a última aberta em primeiro.
5. Reabrir uma delas várias vezes e mostrar a obra subindo em **Mais vistas**, uma posição por vez, só quando passa a contagem da anterior.
6. Buscar o ID **70000** em "Comparar buscas" e mostrar a tabela com as 9 buscas.
7. Buscar o **mesmo ID** de novo e mostrar que árvore afunilada, mover para o início e dedilhada caem para 1 comparação.
8. Mostrar o **Resumo** com as médias da sessão.
9. (Opcional) Mostrar a CLI: `java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli data/classes.csv`, com a opção 10 "Destaques".
