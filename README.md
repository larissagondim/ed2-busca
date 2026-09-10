# WikiArt — Catálogo de Obras

Projeto de Estrutura de Dados II em **Java**, com interface pelo terminal (CLI), para comparar o desempenho de listas encadeadas e suas estratégias de busca e reorganização.

## Ideia do projeto

O usuário informa o ID de uma obra do WikiArt e escolhe um algoritmo de busca. O programa retorna os dados da obra, como artista, estilo e caminho da imagem, além das estatísticas da busca.

O catálogo fica na memória, em uma **lista encadeada própria**, e as imagens ficam armazenadas no disco. Os campos do catálogo serão definidos conforme os metadados disponíveis no dataset.

## Algoritmos

- **Busca sequencial:** percorre a lista até encontrar a obra ou chegar ao final.
- **Movimentação para o início:** move a obra encontrada para o começo da lista.
- **Transposição:** troca a obra encontrada de posição com sua antecessora.

## Funcionalidades planejadas

- Buscar obras por ID e escolher o algoritmo utilizado.
- Cadastrar e remover entradas do catálogo.
- Exibir os dados da obra e a quantidade de comparações e reordenações.
- Comparar o desempenho de cada lista e sua estratégia de busca com a mesma ordem inicial e sequência de consultas.
- Exportar os resultados dos experimentos em CSV, incluindo tempo de CPU, tempo de execução, comparações e reordenações.

## Comparação de desempenho

Cada estratégia terá sua própria lista, com os mesmos dados e a mesma ordem inicial. As listas receberão a mesma sequência de buscas, mantendo suas reorganizações ao longo de cada experimento.

Serão avaliados:

- **Tempo de CPU:** tempo de processamento consumido pela thread que executa as buscas, quando essa medição estiver disponível na JVM.
- **Tempo de execução:** tempo total decorrido durante o lote de buscas.
- **Comparações:** quantidade de verificações entre o ID procurado e o ID de uma obra.
- **Reordenações:** quantidade de movimentações para o início ou trocas com o nó anterior.

Os testes usarão diferentes tamanhos de catálogo, buscas aleatórias, IDs ausentes e acessos repetidos a poucas obras. Haverá aquecimento da JVM e repetições, com semente fixa para reproduzir as consultas. A leitura dos arquivos e a impressão dos resultados ficarão fora das medições.

O objetivo é observar em quais cenários cada estratégia apresenta melhor desempenho e como a reorganização da lista influencia o custo das próximas buscas.

## Organização

O código será dividido em quatro partes: **dados**, **lista encadeada**, **algoritmos de busca** e **aplicação CLI**. Os experimentos ficarão separados do uso normal do catálogo para permitir comparações reproduzíveis.

## Status

Em planejamento. A implementação começará com uma pequena base fictícia, seguida pela importação de uma amostra do WikiArt.

## Futuras implementações
- Interface Web
