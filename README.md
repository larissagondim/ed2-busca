# WikiArt — Catálogo de Obras

Projeto de Estrutura de Dados II em **Java 21**, com interface de terminal (CLI), para estudar e comparar estratégias de busca sobre um catálogo de obras do WikiArt.

Na CLI, o usuário informa um ID e o programa executa todas as oito estratégias compatíveis com busca exata por chave primária. A tela mostra a obra encontrada, o nome da busca, comparações, reorganizações, tempo decorrido, tempo de CPU, número acumulado de buscas e eficácia. A sessão continua até receber `-1` ou ser interrompida com `Ctrl+C`.

As imagens continuam no disco: durante a busca guardamos apenas seus caminhos, evitando gastar memória e contaminar as medições com leitura de JPGs.

## As 14 buscas

| # | Busca | Estrutura usada | Custo esperado da busca |
|---:|---|---|---|
| 1 | Sequencial simples | Lista encadeada própria | O(n) |
| 2 | Sequencial com transposição | Lista encadeada própria | O(n) |
| 3 | Movimentação para o início | Lista encadeada própria | O(n) |
| 4 | Binária | Vetor ordenado por ID | O(log n) |
| 5 | Por interpolação | Vetor ordenado por ID | O(log log n) médio; O(n) pior caso |
| 6 | Em lista com saltos (Skip List) | Lista encadeada em níveis | O(log n) esperado |
| 7 | Fibonacci | Vetor ordenado por ID | O(log n) |
| 8 | Com chave secundária | Lista encadeada, por artista | O(n) |
| 9 | De piso | Vetor ordenado por ID | O(log n) |
| 10 | De teto | Vetor ordenado por ID | O(log n) |
| 11 | De intervalo | Vetor ordenado por ID | O(log n + k), para k resultados |
| 12 | Dedilhada | Lista encadeada com cursor persistente | O(n) pior caso |
| 13 | Da menor chave | Lista encadeada própria | O(n) |
| 14 | Da maior chave | Lista encadeada própria | O(n) |

Busca binária, interpolação e Fibonacci não foram forçadas sobre a lista simplesmente encadeada. Elas precisam acessar posições diretamente para manter sua vantagem, por isso o motor cria uma visão indexada e ordenada dos mesmos dados. A Skip List continua encadeada, mas acrescenta níveis de atalhos probabilísticos.

As heurísticas que alteram a ordem — transposição e movimentação para o início — recebem cópias independentes da lista. Dessa forma, uma estratégia não favorece nem prejudica outra durante os experimentos.

## O que já está implementado

- Importação dos metadados das obras a partir de CSV.
- As 14 estratégias de busca descritas acima.
- Estruturas próprias de lista encadeada, tabela ordenada e Skip List.
- CLI contínua para comparar as oito buscas exatas por ID.
- Contagem de comparações e reorganizações.
- Medição de tempo decorrido, tempo de CPU e estatísticas acumuladas da sessão.
- Testes das 14 buscas, incluindo chaves ausentes e catálogo vazio.

## Como rodar

### Pré-requisitos

- JDK 21 ou superior.
- Maven 3.9 ou superior é recomendado, mas não obrigatório.
- O arquivo `data/amostra-classes.csv` para executar com a configuração padrão.

Confira se o Java está disponível:

```bash
java -version
```

Todos os comandos abaixo devem ser executados na raiz do projeto.

### Opção 1 — com Maven

Compile o projeto:

```bash
mvn compile
```

Execute a aplicação usando a amostra padrão:

```bash
java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli
```

### Opção 2 — sem Maven

O projeto também pode ser compilado diretamente com o JDK:

```bash
mkdir -p out
java -m jdk.compiler/com.sun.tools.javac.Main \
  -encoding UTF-8 \
  -d out \
  $(find src/main/java src/test/java -name '*.java')
```

Depois, execute a aplicação:

```bash
java -cp out br.edu.ufpb.wikiart.app.CatalogoCli
```

### Usando a CLI

Informe os IDs das obras, um por vez. Digite `-1` para encerrar e mostrar o resumo:

```text
ID da obra (-1 encerra): 25
ID da obra (-1 encerra): 100
ID da obra (-1 encerra): -1
```

Para cada ID, a aplicação compara busca sequencial, transposição, movimentação para o início, binária, interpolação, Skip List, Fibonacci e dedilhada. As outras seis buscas estão disponíveis no `MotorDeBuscas`, mas não entram nessa comparação automática porque recebem artista, intervalo ou consultas de mínimo e máximo em vez de um ID exato.

### Escolhendo o conjunto de dados

Sem argumento, a aplicação usa `data/amostra-classes.csv`, que contém 5.007 obras. Para usar o catálogo completo, com 80.042 obras:

```bash
# Se compilou com Maven
java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli data/classes.csv

# Se compilou diretamente com o JDK
java -cp out br.edu.ufpb.wikiart.app.CatalogoCli data/classes.csv
```

Também é possível informar o caminho de qualquer CSV compatível:

```bash
java -cp out br.edu.ufpb.wikiart.app.CatalogoCli caminho/para/catalogo.csv
```

Como o dataset não fornece um ID primário único, o importador atribui IDs sequenciais e estáveis conforme a ordem das linhas. Somente os metadados e caminhos são carregados; os arquivos de imagem não são abertos durante as buscas.

### Rodando os testes

Após compilar pela opção sem Maven, execute:

```bash
java -ea -cp out br.edu.ufpb.wikiart.BuscaTest
```

O resultado esperado é:

```text
OK — 14 buscas validadas, incluindo ausências e catálogo vazio.
```

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

```text
src/main/java/br/edu/ufpb/wikiart/
├── app/        # interface de terminal
├── data/       # importação dos metadados
├── metric/     # tempos e estatísticas acumuladas da sessão
├── model/      # representação de uma obra
├── search/     # algoritmos e resultados
├── service/    # coordenação das estruturas
└── structure/  # lista própria, tabela ordenada e Skip List
```

Os experimentos continuarão separados do uso normal do catálogo. A API `MotorDeBuscas` já devolve métricas sem imprimir durante a operação, o que facilita adicionar aquecimento da JVM, tempo de CPU, tempo decorrido e exportação CSV sem alterar os algoritmos.

## Status

As 14 buscas, o carregamento do CSV, as métricas, a CLI e os testes estão implementados.

As próximas etapas são:

- construir o módulo de experimentos reproduzíveis;
- exportar os resultados dos experimentos em CSV;
- implementar cadastro e remoção de obras, mantendo todas as estruturas sincronizadas;
- criar uma interface web.

## Futuras implementações

- Interface web.
