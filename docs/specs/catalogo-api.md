# Especificação: catálogo local e comparação

Disponibilizar as 81.444 obras por período/estilo sem inventar metadados. O ID sequencial é a chave dos algoritmos e `codigoAcervo` é o nome único do arquivo sem extensão. O catálogo pode ser global ou limitado a um período.

Erros usam `{ "codigo", "mensagem", "campo" }`: entrada inválida retorna 400; recurso inexistente ou obra fora do filtro retorna 404. Páginas começam em zero, têm 24 itens por padrão e no máximo 100. Ordenações: `id`, `codigo`, `titulo`.

Uma sessão possui um motor, filtro e acumulados; mudar o filtro ou apagar a sessão recria tudo. Sessões inativas expiram em 30 minutos. Busca por código resolve o ID antes das oito buscas exatas. Imagens só podem vir de caminhos registrados; miniaturas preservam proporção, têm maior lado de 480 px e cache em `data/thumbnails`.

Armazenamento: Skip Lists indexáveis por ID (índice principal), código e título (global e por estilo) e Skip List de estilos; nenhuma coleção da biblioteca indexa o catálogo. `POST /api/obras/{id}/visualizacoes?limite=8` move a obra para o início da lista de recentes (até 50 obras) e registra uma visualização no ranking; ele e `GET /api/destaques?limite=8` devolvem `{ recentes: Obra[], maisVistas: { obra, visualizacoes }[] }`. O limite fica entre 1 e 50. Leituras internas (`GET /api/obras/{id}`, imagens) não contam como visualização.

As seis consultas que não procuram chave exata ficam em `POST /api/buscas/consulta` (`tipo`: `CHAVE_SECUNDARIA` com `artista`; `PISO`/`TETO` com `inicio`; `INTERVALO` com `inicio` e `fim`; `MENOR_CHAVE`/`MAIOR_CHAVE` sem chave). Rodam no subconjunto da sessão, devolvem até 24 obras, o total e as comparações, e não entram nos acumulados.

## Aceitação

- Dado o CSV completo, quando carregado, então há IDs 0–81.443, códigos únicos e 27 estilos.
- Dado um período, quando uma página é pedida, nenhuma obra externa aparece.
- Dada uma obra fora do filtro, quando consultada, a API responde 404.
- Dado ID ou código válido, a comparação retorna obra, oito medições e acumulados.
- Dadas duas sessões, reorganizações de uma não alteram a outra.
- Dada uma imagem registrada, duas requisições de miniatura reutilizam o cache.
- Dadas visualizações de A, B e A de novo, recentes começam por A e o ranking põe A (2) antes de B (1).
- Dada a página k, a resposta vem da posição k·tamanho da Skip List, sem ordenar o subconjunto.
