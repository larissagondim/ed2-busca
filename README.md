# WikiArt — Catálogo de Obras

Projeto de Estrutura de Dados II em **Java 21**, com API Spring Boot, interface React e terminal (CLI), para navegar pelo catálogo local e comparar estratégias de busca.

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

### Por que a comparação mostra 8, e não 14?

Os 14 métodos estão implementados e são testados em `BuscaTest`. Entretanto, somente oito possuem o mesmo contrato: recebem uma chave primária e procuram exatamente a obra identificada por ela. Por isso, a comparação automática por ID ou código executa sequencial simples, transposição, movimentação para o início, binária, interpolação, Skip List, Fibonacci e dedilhada.

Os seis restantes não estão ausentes; eles respondem a consultas diferentes e compará-los como se fossem buscas exatas produziria métricas enganosas:

- **chave secundária:** recebe um artista e pode retornar várias obras; o catálogo atual registra `Artista desconhecido`, pois o dataset não fornece esse metadado de forma confiável;
- **piso:** retorna a maior chave menor ou igual à chave informada;
- **teto:** retorna a menor chave maior ou igual à chave informada;
- **intervalo:** recebe dois limites e pode retornar várias obras;
- **menor chave:** não recebe uma chave de busca e encontra o menor ID;
- **maior chave:** não recebe uma chave de busca e encontra o maior ID.

Esses métodos permanecem disponíveis em `MotorDeBuscas`. Para expô-los na interface será necessário criar formulários e resultados próprios para cada tipo de consulta, em vez de adicioná-los à tabela de busca exata.

## O que já está implementado

- Geração e importação do catálogo a partir das pastas de imagens do dataset.
- As 14 estratégias de busca descritas acima.
- Estruturas próprias de lista encadeada, tabela ordenada e Skip List.
- CLI contínua para comparar as oito buscas exatas por ID.
- Contagem de comparações e reorganizações.
- Medição de tempo decorrido, tempo de CPU e estatísticas acumuladas da sessão.
- Testes das 14 buscas, incluindo chaves ausentes e catálogo vazio.
- Interface React responsiva com catálogo por período, paginação, detalhes da obra e comparação das buscas exatas.
- Build único de produção: o frontend é compilado e incorporado ao JAR Spring Boot.
- CI com type-check, ESLint, testes unitários, cobertura e testes ponta a ponta com Playwright.

## Mudanças recentes

- O frontend passou a ter validação automatizada de tipos, lint e cobertura de testes.
- O build Maven agora instala as dependências do frontend, executa suas verificações, gera `frontend/dist` e copia os arquivos para o JAR final.
- A CI executa o JAR com um catálogo de teste e valida o fluxo completo no Chromium com Playwright.
- A configuração do ESLint e o `package-lock.json` estão versionados para tornar os builds locais e da CI reproduzíveis.

## Como rodar

### Pré-requisitos

- JDK 21 ou superior.
- Node.js 22 ou superior e npm para compilar/testar o frontend.
- `curl` e `unzip` na primeira execução do Maven Wrapper.

Maven não precisa estar instalado: o script `mvnw` baixa a versão prevista pelo projeto. Node.js não é necessário para executar um JAR que já tenha sido gerado, mas é necessário para executar `./mvnw verify`, pois essa etapa testa e empacota o frontend.

Confira se o Java está disponível:

```bash
java -version
```

Todos os comandos abaixo devem ser executados na raiz do projeto.

### Execução rápida da aplicação web

O repositório já contém `data/classes.csv`, com os 42.500 registros. Compile, teste e gere o JAR único:

```bash
./mvnw verify
java -jar target/wikiart-catalogo-1.0.0-SNAPSHOT.jar
```

Abra `http://localhost:8080`.

O artefato gerado fica em:

```text
target/wikiart-catalogo-1.0.0-SNAPSHOT.jar
```

O mesmo JAR contém a API e os arquivos estáticos do frontend, portanto não é necessário manter um servidor Node.js separado em produção.

### Desenvolvimento do frontend

Para trabalhar com atualização automática da página, abra dois terminais na raiz do projeto.

No primeiro, inicie a API:

```bash
./mvnw spring-boot:run
```

No segundo, inicie o Vite:

```bash
cd frontend
npm ci
npm run dev
```

Abra `http://localhost:5173`. Durante o desenvolvimento, o Vite encaminha as chamadas de `/api` para `http://localhost:8080`.

Para gerar somente os arquivos estáticos do frontend:

```bash
cd frontend
npm run build
```

O resultado fica em `frontend/dist`.

### É necessário ter as 42.500 imagens?

**Não.** O projeto funciona sem os arquivos JPG. O catálogo, os 42.500 registros, os filtros, a paginação, as buscas, as reorganizações e as métricas usam apenas `data/classes.csv`. O carregador lê os metadados e os caminhos registrados, mas não tenta abrir nem validar as imagens durante a inicialização ou durante uma busca.

Quando um JPG não existe:

- a aplicação continua funcionando normalmente;
- os endpoints de imagem respondem com erro `404` e código `IMAGEM_NAO_ENCONTRADA`;
- o frontend mostra o estado “Imagem indisponível” nos cartões que não possuem miniatura.

Para visualizar as obras, extraia opcionalmente `data/archive.zip` em `data/wikiart`, preservando o ZIP original. As miniaturas serão geradas sob demanda em `data/thumbnails`.

### Usando outro catálogo

O catálogo padrão da aplicação web é `data/classes.csv`. Para usar outro CSV compatível:

```bash
WIKIART_CATALOGO=/caminho/catalogo.csv \
  java -jar target/wikiart-catalogo-1.0.0-SNAPSHOT.jar
```

O CSV atual usa as colunas `codigo_acervo,titulo,artista,estilo,caminho_imagem`. O ID interno não fica no arquivo: ele é atribuído sequencialmente conforme a ordem das linhas.

Se você substituir o dataset de imagens, poderá gerar novamente o catálogo após compilar:

```bash
java -cp target/classes br.edu.ufpb.wikiart.data.GeradorCatalogoCsv
```

O dataset usado neste projeto contém apenas o estilo (nome da pasta) e um
código numérico (nome do arquivo). Por isso, o gerador registra títulos como
`Obra 232331` e o artista como `Artista desconhecido`; nenhuma imagem é aberta.

### CLI

Compile o projeto e abra o menu textual usando a amostra de 5.007 registros:

```bash
./mvnw compile
java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli
```

Para carregar os 42.500 registros, informe o CSV completo:

```bash
java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli data/classes.csv
```

### Usando a CLI

A CLI apresenta o seguinte menu:

```text
1 Períodos | 2 Filtro | 3 Listar | 4 ID | 5 Código | 6 Comparar | 7 Métricas | 8 Reiniciar | 9 Sair
```

Para cada ID, a aplicação compara busca sequencial, transposição, movimentação para o início, binária, interpolação, Skip List, Fibonacci e dedilhada. As outras seis buscas estão disponíveis no `MotorDeBuscas`, mas não entram nessa comparação automática porque recebem artista, intervalo ou consultas de mínimo e máximo em vez de um ID exato.

Também é possível informar qualquer CSV compatível:

```bash
java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli caminho/para/catalogo.csv
```

Como o dataset não fornece um ID primário único, o importador atribui IDs sequenciais e estáveis conforme a ordem das linhas. Somente os metadados e caminhos são carregados; os arquivos de imagem não são abertos durante as buscas.

### Rodando os testes

Para executar backend, type-check, lint, testes e cobertura do frontend, gerar o frontend de produção, incorporá-lo ao JAR e validar a cobertura Java:

```bash
./mvnw verify
```

A suíte atual possui 8 testes Java e 9 testes unitários do frontend. A CI também inicia o JAR e executa os testes ponta a ponta do Playwright no Chromium.

Os principais resultados são gravados em:

```text
target/surefire-reports   # testes Java
target/site/jacoco        # cobertura Java
frontend/coverage         # cobertura do frontend
frontend/playwright-report # relatório ponta a ponta
```

Depois de `./mvnw test`, o teste das estratégias também pode ser executado diretamente com:

```bash
java -ea -cp target/test-classes:target/classes br.edu.ufpb.wikiart.BuscaTest
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

O projeto está funcional como aplicação web e CLI. O catálogo global e por período, API paginada, busca por ID/código, sessões isoladas, miniaturas, comparação, resumo, frontend responsivo, empacotamento em JAR único e CI automatizada estão implementados. A CI valida o projeto, mas não realiza deploy. Os contratos e decisões ficam em `docs/specs` e `docs/adr`.
