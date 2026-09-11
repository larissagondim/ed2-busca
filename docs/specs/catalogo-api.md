# Especificação: catálogo local e comparação

Disponibilizar as 42.500 obras por período/estilo sem inventar metadados. O ID sequencial é a chave dos algoritmos e `codigoAcervo` é o nome único do arquivo sem extensão. O catálogo pode ser global ou limitado a um período.

Erros usam `{ "codigo", "mensagem", "campo" }`: entrada inválida retorna 400; recurso inexistente ou obra fora do filtro retorna 404. Páginas começam em zero, têm 24 itens por padrão e no máximo 100. Ordenações: `id`, `codigo`, `titulo`.

Uma sessão possui um motor, filtro e acumulados; mudar o filtro ou apagar a sessão recria tudo. Sessões inativas expiram em 30 minutos. Busca por código resolve o ID antes das oito buscas exatas. Imagens só podem vir de caminhos registrados; miniaturas preservam proporção, têm maior lado de 480 px e cache em `data/thumbnails`.

## Aceitação

- Dado o CSV completo, quando carregado, então há IDs 0–42.499, códigos únicos e 13 períodos.
- Dado um período, quando uma página é pedida, nenhuma obra externa aparece.
- Dada uma obra fora do filtro, quando consultada, a API responde 404.
- Dado ID ou código válido, a comparação retorna obra, oito medições e acumulados.
- Dadas duas sessões, reorganizações de uma não alteram a outra.
- Dada uma imagem registrada, duas requisições de miniatura reutilizam o cache.
