# Catálogo WikiArt — descrição da aplicação e do desenvolvimento

> Texto exigido na avaliação: descrição da aplicação, das estruturas de dados usadas e do processo de desenvolvimento.

## 1. A aplicação

O **Catálogo WikiArt** permite navegar por um acervo de **81.444 pinturas** de **27 estilos** (Barroco, Impressionismo, Cubismo...), com imagem, artista e título de cada obra. A base é o dataset público do WikiArt (cerca de 34 GB de imagens), escolhido por ser multimídia e grande.

Funcionalidades para o usuário:

| Funcionalidade | O que o usuário vê | Estrutura que a implementa |
|---|---|---|
| Navegar pelo catálogo | Grade paginada, global ou por estilo, ordenada por ID, código ou título | Lista com Saltos indexável |
| Lista de estilos | Seletor com os 27 estilos em ordem alfabética e a quantidade de obras | Árvore Afunilada (por slug), percurso em ordem |
| Buscar obra | Busca por ID interno ou por código original | Árvore Afunilada (ID) e Lista com Saltos (código) |
| **Vistas recentemente** | As últimas obras abertas, da mais recente para a mais antiga | Árvore Afunilada: topo da árvore |
| **Mais vistas** | Ranking das obras mais abertas, com contagem | Lista encadeada com transposição |
| Comparar buscas | Comparações, reorganizações e tempo das 9 buscas exatas para a mesma obra, e médias da sessão | Lista encadeada, vetor ordenado, Lista com Saltos e Árvore Afunilada |

Há duas interfaces sobre o mesmo núcleo Java: a **web** (Spring Boot + React, empacotada num único JAR) e a **CLI** de terminal.

## 2. Estruturas de dados

Todas as estruturas que guardam ou indexam obras foram implementadas pelo grupo, no pacote `structure/`. Coleções da biblioteca Java (`List`) aparecem apenas para **transportar** resultados até a interface (JSON), nunca para armazenar ou indexar o catálogo.

| Estrutura | Tipo | Classe | Uso |
|---|---|---|---|
| Lista simplesmente encadeada | Linear | `ListaEncadeadaObras` | Buscas sequenciais, transposição, mover para o início, dedilhada |
| Lista encadeada auto-organizável | Linear | `ListaMaisVistas` | Ranking "mais vistas" |
| Vetor ordenado | Linear | `TabelaOrdenadaObras` | Buscas binária, interpolação, Fibonacci, piso, teto, intervalo |
| **Lista com Saltos** (obrigatória) | Linear em níveis | `ListaComSaltos` | Armazenamento ordenado e paginação, busca por código, comparação |
| **Árvore Afunilada** (obrigatória) | **Hierárquica** | `ArvoreAfunilada` | Índice principal por ID, "vistas recentemente", estilos, comparação |

Regras do enunciado atendidas:

- **Só listas e árvores vistas em aula:** listas encadeadas, vetor, Lista com Saltos e Árvore Afunilada.
- **Uso obrigatório de Lista com Saltos ou Árvore Afunilada:** as duas são usadas.
- **Ao menos uma estrutura linear e uma hierárquica:** listas e vetor (lineares) e Árvore Afunilada (hierárquica).
- **Uso no armazenamento e nas funcionalidades:** ver as duas tabelas acima.

### Como o catálogo fica guardado (`CatalogoService`)

```
CSV (81.444 linhas)
   │
   ├─► Grupo global ─┬─ ListaComSaltos<ID>      ← paginação por ID / carga da árvore
   │                 ├─ ListaComSaltos<código>  ← paginação por código + busca por código
   │                 └─ ListaComSaltos<título>  ← paginação por título
   │
   ├─► ArvoreAfunilada<slug, Grupo>  (27 estilos, cada um com as mesmas 3 Skip Lists)
   │
   ├─► ArvoreAfunilada<ID, Obra>     ← índice principal + "vistas recentemente"
   │
   └─► ListaMaisVistas               ← ranking, cresce conforme as obras são abertas
```

## 3. Modificações nos algoritmos clássicos

### 3.1 Árvore Afunilada (`ArvoreAfunilada`)

O algoritmo clássico funciona assim: toda busca leva o nó encontrado (ou o último nó visitado) até a raiz por rotações zig, zig-zig e zig-zag, e toda inserção também afunila o nó.

| Modificação | Problema na aplicação | Solução |
|---|---|---|
| **Carga em lote balanceada** (`deOrdenados`) | O CSV chega em ordem de ID. Inserir chaves crescentes afunilando uma a uma gera uma árvore com altura 81.444 (vira uma lista), e a primeira busca por ID 0 custaria 81.444 comparações. | A árvore é montada já balanceada em O(n) a partir da Skip List ordenada. A altura inicial é 17, e o afunilamento segue normal a partir daí. |
| **Consulta sem afunilamento** (`consultar` × `acessar`) | Servir miniaturas e validar filtros também leem a árvore. Se essas leituras afunilassem, uma grade com 24 miniaturas jogaria 24 obras para o topo sem o usuário ter aberto nenhuma. | Só `acessar`, chamado quando o usuário abre a obra, afunila. Leituras internas usam uma busca em árvore binária comum, sem rotações. |
| **"Vistas recentemente" pelo topo da árvore** (`recentes`) | Seria preciso uma estrutura extra só para o histórico. | Cada obra aberta vira a raiz, e as abertas antes dela descem aos poucos. Um percurso em largura limitado a 8 níveis, que devolve só os nós marcados como acessados, dá o histórico direto da árvore, do mais recente para o mais antigo. A fila do percurso também é uma lista encadeada própria. |
| Implementação iterativa com ponteiro para o pai | A recursão estouraria a pilha numa árvore degenerada. | Afunilamento, inserção e percurso em ordem não usam recursão. |

Na comparação de buscas, cada rotação conta como uma "reorganização". Por isso dá para ver a árvore se adaptando: a segunda busca pela mesma obra custa 1 comparação.

### 3.2 Lista com Saltos indexável (`ListaComSaltos`)

No algoritmo clássico de Pugh, cada nó tem um vetor de ponteiros, um por nível. A busca desce pelos níveis e a inserção sorteia o nível do novo nó. Não é possível ir direto para a k-ésima posição: é preciso percorrer k nós.

**Modificação:** cada ponteiro também guarda a sua **largura**, isto é, quantos nós do nível 0 ele pula.

- A inserção divide a largura do ponteiro anterior entre ele e o novo nó, e soma 1 nos níveis que passam por cima do novo nó.
- `obter(i)` desce pelos níveis somando larguras até chegar à posição i, em O(log n) esperado.

**Por que isso foi necessário:** paginar o catálogo. Antes, cada requisição de página **ordenava todas as obras** do filtro (`stream().sorted()`, O(n log n)) e depois cortava 24. Agora a página 3.000 de 81.444 obras sai com um salto até a posição 72.000 e 24 passos no nível 0. Medimos 90 ms ponta a ponta. Uma Skip List por ordenação (ID, código, título), em cada estilo, permite trocar a ordem sem reordenar nada.

### 3.3 Lista "mais vistas" com transposição guardada (`ListaMaisVistas`)

Na transposição clássica, ao encontrar um elemento, ele troca de lugar com o anterior. A lista contém todos os elementos desde o início.

| Modificação | Motivo |
|---|---|
| **Crescimento sob demanda:** a lista começa vazia e a obra entra no fim na primeira vez que é vista. | O ranking só deve conter obras realmente acessadas. Além disso, a busca sequencial percorre dezenas de nós, não 81.444. |
| **Transposição com guarda de frequência:** cada nó conta suas visualizações, e a troca com o anterior só acontece se o nó passou a ter **mais** visualizações que ele. | Na clássica, uma obra vista uma única vez trocaria de lugar com outra vista 10 vezes. Aqui a lista continua subindo uma posição por acesso, como manda a transposição, mas o topo fica estável e reflete a popularidade. |

### 3.4 Outras adaptações

- **Busca dedilhada circular:** o "dedo" fica no último nó encontrado e, como a lista não é ordenada, a busca dá a volta pelo início antes de concluir que a chave não existe.
- **Listas independentes por heurística:** transposição, mover para o início e dedilhada recebem cópias próprias da lista, para que a reorganização de uma não favoreça a outra na comparação.

## 4. Processo de desenvolvimento

1. **Núcleo de buscas (set/2026).** Começamos pela parte de algoritmos: leitura do CSV, lista encadeada própria, vetor ordenado, Skip List e as 14 buscas estudadas na disciplina, com contagem de comparações e reorganizações. Uma CLI permitia testar tudo no terminal.
2. **Aplicação web.** Uma API Spring Boot passou a expor o catálogo e uma sessão de comparação de buscas por usuário, e uma interface React mostra a grade de obras, os detalhes e as métricas. O frontend é compilado dentro do JAR, então basta `java -jar` para rodar.
3. **Qualidade.** Integração contínua no GitHub Actions com testes Java (JUnit + Mockito), cobertura mínima (JaCoCo), type-check, lint, testes unitários do frontend (Vitest) e testes ponta a ponta (Playwright).
4. **Adequação ao enunciado.** Revisamos o projeto contra as regras do trabalho e encontramos três lacunas:
   - não havia estrutura hierárquica;
   - o armazenamento real ainda usava `HashMap` e `TreeMap` da biblioteca Java;
   - os algoritmos eram os clássicos.

   Para resolver, implementamos a Árvore Afunilada, passamos o armazenamento inteiro para as estruturas do projeto e criamos as funcionalidades "vistas recentemente" e "mais vistas", junto com as modificações descritas na seção 3.
5. **Dataset completo.** Trocamos o catálogo inicial (42.500 imagens sem metadados) pelo dataset WikiArt completo: 81.444 obras, com artista e título extraídos do nome dos arquivos.

**Uso de LLMs.** Como o enunciado permite, usamos assistentes de código baseados em LLM (por exemplo, o Claude Code) para gerar partes do código, revisar o projeto contra o enunciado e escrever testes. As decisões de quais estruturas usar e que modificações fazer foram discutidas pelo grupo, e todo código gerado passou pelos testes automatizados.

## 5. Como verificar

```bash
./mvnw verify                                             # todos os testes + JAR
java -jar target/wikiart-catalogo-1.0.0-SNAPSHOT.jar      # http://localhost:8080
```

Os testes das estruturas e das modificações estão em `src/test/java/br/edu/ufpb/wikiart/EstruturasTest.java`. Eles verificam:
- a altura da árvore após a carga balanceada;
- que `consultar` não afunila;
- a ordem dos recentes;
- que `obter(i)` da Skip List bate com a ordem;
- a transposição guardada do ranking.
