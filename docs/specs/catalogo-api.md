# Especificação: catálogo local e comparação

Disponibilizar as 81.444 obras por período/estilo sem inventar metadados. O ID sequencial é a chave dos algoritmos e `codigoAcervo` é o nome único do arquivo sem extensão. O catálogo pode ser global ou limitado a um período.

Erros usam `{ "codigo", "mensagem", "campo" }`: entrada inválida retorna 400; recurso inexistente ou obra fora do filtro retorna 404. Páginas começam em zero, têm 24 itens por padrão e no máximo 100. Ordenações: `id`, `codigo`, `titulo`.

Uma sessão possui um motor, filtro e acumulados; mudar o filtro ou apagar a sessão recria tudo. Sessões inativas expiram em 30 minutos. Busca por código resolve o ID antes das oito buscas exatas (sequencial, transposição, mover para o início, binária, interpolação, Skip List, `ARVORE_AVL` e dedilhada). Imagens só podem vir de caminhos registrados; miniaturas preservam proporção, têm maior lado de 480 px e cache em `data/thumbnails`.

Armazenamento: Skip Lists indexáveis por ID (índice principal), código e título (global e por estilo) e Skip List de estilos; nenhuma coleção da biblioteca indexa o catálogo. `POST /api/obras/{id}/visualizacoes?limite=8` move a obra para o início da lista de recentes (até 50 obras) e registra uma visualização no ranking; ele e `GET /api/destaques?limite=8` devolvem `{ recentes: Obra[], maisVistas: { obra, visualizacoes }[] }`. O limite fica entre 1 e 50. Leituras internas (`GET /api/obras/{id}`, imagens) não contam como visualização.

As seis consultas que não procuram chave exata ficam em `POST /api/buscas/consulta` (`tipo`: `CHAVE_SECUNDARIA` com `artista`; `PISO`/`TETO` com `inicio`; `INTERVALO` com `inicio` e `fim`; `MENOR_CHAVE`/`MAIOR_CHAVE` sem chave). Rodam no subconjunto da sessão, devolvem até 24 obras, o total e as comparações, e não entram nos acumulados.

Artistas: uma Árvore AVL indexa os artistas pelo nome normalizado (sem acentos, minúsculo); cada nó aponta para a lista encadeada das obras e soma as visualizações delas. Cada nó guarda o tamanho da subárvore, então a página k é obtida por descida, sem ordenar.

- `GET /api/artistas?page=&size=` devolve `{ conteudo: { nome, quantidadeObras, visualizacoes, posicao }[], pagina, tamanho, totalElementos, totalPaginas }` em ordem alfabética (`posicao` em base zero). Mesmas regras de `page` e `size` de `/api/obras`.
- `GET /api/artistas/{nome}/obras?page=&size=` devolve `{ artista, conteudo: Obra[], pagina, tamanho, totalElementos, totalPaginas, comparacoes, profundidade }`: as obras do artista (nome sem distinção de acentos e maiúsculas), as comparações feitas na AVL e a profundidade do nó (raiz = 0). Artista inexistente retorna 404 com `ARTISTA_NAO_ENCONTRADO`.
- `GET /api/estruturas` devolve `{ skipLists: { nome, tamanho, niveis }[], recentes, capacidadeRecentes, maisVistas, arvores }`, com `arvores = { artistas, alturaAvl, alturaAbb, alturaMinimaTeorica, rotacoes: { simplesEsquerda, simplesDireita, duplaEsquerdaDireita, duplaDireitaEsquerda }, comparacoesMediasAvl, comparacoesMediasAbb, obras }`. A ABB é construída só para comparação e não é usada pela aplicação. Alturas são em níveis (nó único = 1) e `alturaMinimaTeorica` = ⌊log₂ n⌋ + 1.
- `POST /api/obras/{id}/visualizacoes` e `GET /api/destaques` passam a devolver também `artistasVistos`: artistas com ao menos uma visualização, em ordem alfabética (percurso da AVL); quem ranqueia é o cliente.
- `POST /api/buscas/consulta` com `CHAVE_SECUNDARIA` roda a busca sequencial (O(n)) e a da AVL e devolve, além dos campos de sempre, `comparativo = { comparacoesSequencial, comparacoesAvl, tempoSequencialMicros, tempoAvlMicros, mesmoResultado }`. `CHAVE_SECUNDARIA_AVL` roda só a AVL e não traz `comparativo`. Nas duas, o artista é comparado sem acentos e sem distinção de maiúsculas.

## Aceitação

- Dado o CSV completo, quando carregado, então há IDs 0–81.443, códigos únicos e 27 estilos.
- Dado um período, quando uma página é pedida, nenhuma obra externa aparece.
- Dada uma obra fora do filtro, quando consultada, a API responde 404.
- Dado ID ou código válido, a comparação retorna obra, oito medições e acumulados.
- Dadas duas sessões, reorganizações de uma não alteram a outra.
- Dada uma imagem registrada, duas requisições de miniatura reutilizam o cache.
- Dadas visualizações de A, B e A de novo, recentes começam por A e o ranking põe A (2) antes de B (1).
- Dada a página k, a resposta vem da posição k·tamanho da Skip List, sem ordenar o subconjunto.
- Dado o CSV completo, `/api/estruturas` informa 1.119 artistas, altura 12 na AVL e 145 na ABB.
- Dado um artista, a busca sequencial e a da AVL devolvem exatamente as mesmas obras, inclusive com acentos e maiúsculas diferentes; artista inexistente retorna lista vazia na consulta e 404 em `/api/artistas/{nome}/obras`.
- Dadas visualizações de duas obras do mesmo artista, `artistasVistos` mostra o artista com a soma das duas.
