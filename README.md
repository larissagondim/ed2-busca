# WikiArt — Catálogo de Obras

Projeto de Estrutura de Dados II em **Java 21**, com API Spring Boot, interface React e terminal (CLI), para navegar pelo catálogo local e comparar estratégias de busca.

O catálogo tem **81.444 obras de 27 estilos**, com artista e título, e é armazenado inteiramente em estruturas implementadas pelo grupo: **Lista com Saltos indexável**, **listas encadeadas** e uma **Árvore AVL** de artistas. Além de navegar e buscar, o usuário vê as obras **vistas recentemente** (lista com movimentação para o início) e as **mais vistas** (lista com transposição).

Na CLI, o usuário informa um ID e o programa executa todas as oito estratégias compatíveis com busca exata por chave primária. A tela mostra a obra encontrada, o nome da busca, comparações, reorganizações, tempo decorrido, tempo de CPU, número acumulado de buscas e eficácia. A sessão continua até receber `-1` ou ser interrompida com `Ctrl+C`.

As imagens continuam no disco: durante a busca guardamos apenas seus caminhos, evitando gastar memória e contaminar as medições com leitura de JPGs.

## Estruturas de dados e modificações

A estrutura obrigatória do enunciado ("Lista com Saltos **ou** Árvore Afunilada") é a **Lista com Saltos**; a Árvore Afunilada (Splay) não é usada. A estrutura **hierárquica** do projeto, exigida além das lineares, é a **Árvore AVL**. Nenhuma coleção da biblioteca (`HashMap`, `TreeMap`, `Arrays.sort`…) guarda ou ordena dados do catálogo.

| Funcionalidade | Estrutura | Tipo | Modificação |
|---|---|---|---|
| Navegação, paginação, períodos e busca por código | Lista com Saltos (`ListaComSaltos`) | Linear | Indexável por larguras |
| "Mais vistas" | Lista encadeada com transposição (`ListaMaisVistas`) | Linear | Transposição com guarda de frequência |
| "Vistas recentemente" | Lista encadeada com movimentação para o início (`ListaRecentes`) | Linear | Capacidade limitada |
| Busca por ID na comparação (painel Buscar) | Árvore AVL por ID (`ArvoreAvlObras`) | Hierárquica | Altura, tamanho da subárvore e profundidade do nó na busca |
| Artistas em ordem alfabética, obras por artista, visualizações por artista | Árvore AVL (`ArvoreAvlArtistas`) | Hierárquica | Estatística de ordem + visualizações agregadas |
| Buscas binária e interpolação | Vetor ordenado por ID (`TabelaOrdenadaObras`) | Linear (visão auxiliar) | Preenchido pelo nível 0 da Skip List, sem ordenar |

### Lista com Saltos indexável (larguras)

- **Algoritmo clássico:** lista ordenada com níveis probabilísticos de atalhos; buscar e inserir em O(log n) esperado, mas acessar a i-ésima posição exige percorrer i nós.
- **O que mudou:** cada ponteiro guarda uma *largura*, quantos nós do nível 0 ele pula. `obter(i)` desce somando larguras.
- **Por que a aplicação precisa:** paginar 81.444 obras (página 1.000 do acervo) sem ordenar nem copiar o catálogo a cada requisição.
- **Custo:** posição i e página em O(log n) esperado (+ k para os k itens da página); a inserção mantém as larguras sem custo assintótico extra.

### Mais vistas: transposição com guarda de frequência

- **Algoritmo clássico:** a cada acesso, o nó encontrado troca de lugar com o anterior.
- **O que mudou:** a lista cresce sob demanda e cada nó conta suas visualizações; a troca só ocorre se o nó passou a ter *mais* visualizações que o anterior.
- **Por que a aplicação precisa:** uma obra vista uma vez não pode passar à frente de outra vista dez vezes; o ranking reflete a popularidade, não o último clique.
- **Custo:** O(posição do nó), que é pequena porque a lista só tem obras já abertas.

### Vistas recentemente: movimentação para o início com capacidade

- **Algoritmo clássico:** o nó encontrado vai para o início da lista.
- **O que mudou:** crescimento sob demanda e capacidade limitada (50); passando dela, o nó do fim (visto há mais tempo) é descartado.
- **Por que a aplicação precisa:** o histórico deve mostrar só o que foi aberto e não crescer sem limite.
- **Custo:** O(capacidade) por registro, no máximo 50 nós.

### Árvore AVL de artistas: estatística de ordem

- **Algoritmo clássico:** árvore binária de busca que, após cada inserção, confere o fator de balanceamento dos ancestrais e aplica rotações simples ou duplas para manter |fator| ≤ 1, o que limita a altura a ≈ 1,44·log₂ n.
- **O que mudou:** cada nó guarda também o *tamanho da subárvore* (artistas nela, contando o próprio nó), atualizado em todas as rotações. `artistaNaPosicao(i)`, `posicaoDe(nome)` e `fatia(início, quantidade)` descem pela árvore comparando com os tamanhos, sem percorrer i nós. É a mesma ideia das larguras da Skip List, aplicada a uma estrutura hierárquica.
- **Por que a aplicação precisa:** listar os 1.119 artistas em ordem alfabética, paginados, e dizer em que posição alfabética cada um está, sem ordenar a cada requisição. A chave é o nome normalizado (sem acentos, minúsculo); o nome original é guardado para exibição, e cada nó aponta para a lista encadeada das obras do artista.
- **Custo:** O(log n) para posição, i-ésimo e início da página; O(k) para os k itens da página.

### Árvore AVL de artistas: visualizações agregadas

- **Algoritmo clássico:** a AVL só guarda chave e valor; contadores ficariam em outra estrutura.
- **O que mudou:** cada nó soma as visualizações das obras do artista. `CatalogoService.visualizar(id)`, além de registrar nos recentes e nas mais vistas, faz uma busca na AVL e incrementa o contador do artista.
- **Por que a aplicação precisa:** "artistas mais vistos" e as visualizações de cada artista saem da própria árvore, sem estrutura paralela.
- **Custo:** O(log n) por visualização; listar os artistas vistos é um percurso em ordem, O(n).

### Vetor ordenado por ID sem `Arrays.sort`

- **Algoritmo clássico:** copiar os dados para um vetor e ordená-lo, O(n log n).
- **O que mudou:** `TabelaOrdenadaObras` recebe a sequência já ordenada (o nível 0 da Skip List por ID) e só confere que os IDs são estritamente crescentes (rejeita duplicados).
- **Por que a aplicação precisa:** as buscas binária e interpolação exigem acesso direto às posições, e a Skip List já entrega a ordem.
- **Custo:** O(n) para montar o vetor, em vez de O(n log n).

### Por que a AVL e não uma árvore binária de busca comum

O CSV traz os artistas em ordem alfabética dentro de cada estilo, justamente o pior caso de uma ABB. O catálogo mantém uma ABB sem balanceamento (`ArvoreBuscaBinariaArtistas`) **só para comparação**: ela recebe os mesmos artistas na mesma ordem e não é usada pela aplicação. Com os 81.444 registros e 1.119 artistas:

| | AVL | ABB sem balanceamento |
|---|---:|---:|
| Altura (níveis) | 12 (mínimo possível: 11) | 145 |
| Comparações médias para achar um artista | 9,35 | 72,69 |
| Busca sequencial na lista | 81.444 comparações (percorre todas as obras) | |

Para construir a AVL foram feitas 626 rotações: 285 simples à esquerda, 91 simples à direita, 154 duplas esquerda-direita e 96 duplas direita-esquerda. Os números aparecem na página **Estruturas** do site ("Estruturas por dentro") e em `GET /api/estruturas`. A decisão está em [`docs/adr/0002-arvore-avl-artistas.md`](docs/adr/0002-arvore-avl-artistas.md).

## As 14 buscas

| # | Busca | Estrutura usada | Custo esperado da busca |
|---:|---|---|---|
| 1 | Sequencial simples | Lista encadeada própria | O(n) |
| 2 | Sequencial com transposição | Lista encadeada própria | O(n) |
| 3 | Movimentação para o início | Lista encadeada própria | O(n) |
| 4 | Binária | Vetor ordenado por ID | O(log n) |
| 5 | Por interpolação | Vetor ordenado por ID | O(log log n) médio; O(n) pior caso |
| 6 | Em lista com saltos (Skip List) | Lista encadeada em níveis | O(log n) esperado |
| 7 | Em árvore AVL | Árvore AVL por ID | O(log n) |
| 8 | Com chave secundária | Lista encadeada, por artista | O(n) |
| 8b | Com chave secundária (variante) | Árvore AVL, por artista | O(log n + k), para k obras |
| 9 | De piso | Vetor ordenado por ID | O(log n) |
| 10 | De teto | Vetor ordenado por ID | O(log n) |
| 11 | De intervalo | Vetor ordenado por ID | O(log n + k), para k resultados |
| 12 | Dedilhada | Lista encadeada com cursor persistente | O(n) pior caso |
| 13 | Da menor chave | Lista encadeada própria | O(n) |
| 14 | Da maior chave | Lista encadeada própria | O(n) |

Busca binária e interpolação não foram forçadas sobre a lista simplesmente encadeada. Elas precisam acessar posições diretamente para manter sua vantagem, por isso o motor cria uma visão indexada e ordenada dos mesmos dados. A Skip List continua encadeada, mas acrescenta níveis de atalhos probabilísticos.

As heurísticas que alteram a ordem — transposição e movimentação para o início — recebem cópias independentes da lista. Dessa forma, uma estratégia não favorece nem prejudica outra durante os experimentos.

### Por que a comparação mostra 8, e não 14?

Os 14 métodos estão implementados e são testados em `BuscaTest`. Entretanto, somente oito possuem o mesmo contrato: recebem uma chave primária e procuram exatamente a obra identificada por ela. Por isso, a comparação automática por ID ou código executa sequencial simples, transposição, movimentação para o início, binária, interpolação, Skip List, Árvore AVL e dedilhada.

Os seis restantes não estão ausentes; eles respondem a consultas diferentes e compará-los como se fossem buscas exatas produziria métricas enganosas:

- **chave secundária:** recebe um artista e pode retornar várias obras;
- **piso:** retorna a maior chave menor ou igual à chave informada;
- **teto:** retorna a menor chave maior ou igual à chave informada;
- **intervalo:** recebe dois limites e pode retornar várias obras;
- **menor chave:** não recebe uma chave de busca e encontra o menor ID;
- **maior chave:** não recebe uma chave de busca e encontra o maior ID.

Esses métodos permanecem disponíveis em `MotorDeBuscas`. Para expô-los na interface será necessário criar formulários e resultados próprios para cada tipo de consulta, em vez de adicioná-los à tabela de busca exata.

## O que já está implementado

- Geração e importação do catálogo a partir das pastas de imagens do dataset.
- As 14 estratégias de busca descritas acima.
- Estruturas próprias: lista encadeada, listas "vistas recentemente" e "mais vistas", tabela ordenada, Skip List indexável e Árvore AVL de artistas (com estatística de ordem e visualizações agregadas).
- Página "Artistas" (lista paginada pela AVL, busca por nome, obras do artista), consulta por artista com a busca sequencial e a AVL lado a lado, e painel "Estruturas por dentro" com altura AVL x ABB e rotações.
- `GET /api/artistas`, `GET /api/artistas/{nome}/obras` e `GET /api/estruturas`.
- Armazenamento do catálogo só nessas estruturas (sem `HashMap`/`TreeMap`).
- "Vistas recentemente" e "Mais vistas" (`POST /api/obras/{id}/visualizacoes`, `GET /api/destaques`).
- CLI contínua para comparar as oito buscas exatas por ID.
- Contagem de comparações e reorganizações.
- Medição de tempo decorrido, tempo de CPU e estatísticas acumuladas da sessão.
- Testes das 14 buscas, incluindo chaves ausentes e catálogo vazio, e das modificações nas estruturas (`EstruturasTest`).
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
- Node.js 22.13 ou superior dentro da linha 22 LTS e npm para compilar/testar o frontend.
- `curl` e `unzip` na primeira execução do Maven Wrapper.

Maven não precisa estar instalado: o script `mvnw` baixa a versão prevista pelo projeto. Node.js não é necessário para executar um JAR que já tenha sido gerado, mas é necessário para executar `./mvnw verify`, pois essa etapa testa e empacota o frontend.

Confira se o runtime e o compilador Java estão disponíveis:

```bash
java -version
javac -version
```

Os dois comandos devem indicar a versão 21 ou superior. Ter apenas o runtime (`java`) não é suficiente para compilar o projeto; é necessário instalar um JDK completo, que também fornece o `javac`.

Se você usa NVM, execute `nvm use` na raiz do repositório para selecionar automaticamente a versão indicada em `.nvmrc`.

Todos os comandos abaixo devem ser executados na raiz do projeto.

### Execução rápida da aplicação web

O repositório já contém `data/classes.csv`, com os 81.444 registros. Compile, teste e gere o JAR único:

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

### É necessário ter as 81.444 imagens?

**Não.** O projeto funciona sem os arquivos JPG. O catálogo, os 81.444 registros, os filtros, a paginação, as buscas, as reorganizações e as métricas usam apenas `data/classes.csv`. O carregador lê os metadados e os caminhos registrados, mas não tenta abrir nem validar as imagens durante a inicialização ou durante uma busca.

Quando um JPG não existe:

- a aplicação continua funcionando normalmente;
- os endpoints de imagem respondem com erro `404` e código `IMAGEM_NAO_ENCONTRADA`;
- o frontend mostra o estado “Imagem indisponível” nos cartões que não possuem miniatura.

Para visualizar as obras, extraia o dataset WikiArt (cerca de 34 GB) em `data/archive`, de modo que existam pastas como `data/archive/Baroque/*.jpg`. As miniaturas serão geradas sob demanda em `data/thumbnails`.

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

O gerador lê as pastas `data/archive/<Estilo>/<artista>_<titulo>.jpg`: o estilo vem da pasta e o artista e o título vêm do nome do arquivo. A mesma pintura pode aparecer em mais de um estilo; nesse caso o código recebe o estilo como sufixo para continuar único. Nenhuma imagem é aberta.

### CLI

Compile o projeto e abra o menu textual usando a amostra de 5.007 registros (espalhados por todos os estilos):

```bash
./mvnw compile
java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli
```

Para carregar os 81.444 registros, informe o CSV completo:

```bash
java -cp target/classes br.edu.ufpb.wikiart.app.CatalogoCli data/classes.csv
```

### Usando a CLI

A CLI apresenta o seguinte menu:

```text
1 Períodos | 2 Filtro | 3 Listar | 4 ID | 5 Código | 6 Comparar | 7 Métricas | 8 Reiniciar | 9 Sair | 10 Destaques
```

Para cada ID, a aplicação compara busca sequencial, transposição, movimentação para o início, binária, interpolação, Skip List, Árvore AVL e dedilhada. Abrir uma obra pelas opções 4 e 5 conta como visualização; a opção 10 mostra os recentes e o ranking. As outras seis buscas estão disponíveis no `MotorDeBuscas`, mas não entram nessa comparação automática porque recebem artista, intervalo ou consultas de mínimo e máximo em vez de um ID exato.

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

A suíte atual possui 34 testes Java (incluindo `ArvoreAvlTest`, que verifica as invariantes da AVL) e 47 testes unitários do frontend. A CI também inicia o JAR e executa os testes ponta a ponta do Playwright no Chromium.

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
OK — 14 buscas (e a chave secundária em AVL) validadas, incluindo ausências e catálogo vazio.
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
└── structure/  # listas encadeadas, tabela ordenada, Skip List indexável e Árvore AVL
```

Os experimentos continuarão separados do uso normal do catálogo. A API `MotorDeBuscas` já devolve métricas sem imprimir durante a operação, o que facilita adicionar aquecimento da JVM, tempo de CPU, tempo decorrido e exportação CSV sem alterar os algoritmos.

## Status

O projeto está funcional como aplicação web e CLI e cobre as estruturas exigidas: a Lista com Saltos (obrigatória) como estrutura linear central e a Árvore AVL como estrutura hierárquica. O catálogo global e por período, API paginada, busca por ID/código, artistas em ordem alfabética pela AVL, sessões isoladas, miniaturas, comparação, resumo, frontend responsivo, empacotamento em JAR único e CI automatizada estão implementados. A CI valida o projeto, mas não realiza deploy. Os contratos e decisões ficam em `docs/specs` e `docs/adr`.

## Imagens no site publicado

O Docker do Render usa uma amostra com 540 obras dos 27 estilos e imagens JPEG
reduzidas de até 480 pixels, incluídas em `deploy/catalogo`. A execução local
continua usando o catálogo completo e `data/archive`. Consulte
[`docs/deploy-vercel.md`](docs/deploy-vercel.md) para gerar a amostra, configurar
os ambientes e atualizar os deploys.
