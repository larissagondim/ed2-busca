# Deploy com frontend na Vercel e API no Render

## Catálogo local e publicado

A execução local continua usando `data/classes.csv` e as imagens originais em
`data/archive`. Nenhum desses arquivos é modificado pelo gerador da amostra.
A configuração padrão em `application.properties` permanece a mesma.

O Docker usa `deploy/catalogo/classes.csv`, acompanhado de JPEGs reduzidos em
`deploy/catalogo/imagens`. A amostra contém 20 obras por estilo (540 obras nos
27 estilos), com **17.847.903 bytes (17,02 MiB)** no total, incluindo CSV
e imagens. Os JPEGs têm até 480 pixels no maior lado, qualidade 75, sem
ampliação de imagens pequenas. No deploy, a rota de imagem “original” entrega
essa mesma versão reduzida; os originais completos continuam apenas locais.

O CSV preserva código de acervo, título, artista e estilo. Somente o caminho da
imagem muda para o derivado incluído no pacote. Os IDs internos são atribuídos
pela ordem das linhas: os IDs da amostra podem diferir dos IDs locais. Use o
código de acervo para identificar a mesma obra nos dois ambientes.

O frontend usa `/api/imagens/{id}/miniatura` e `/original`, sem interpretar
`caminhoImagem`. A API retorna esse campo como registrado no CSV e lê o arquivo
no disco. Todas as áreas do frontend mostram “Imagem indisponível” quando uma
requisição de imagem falha, sem impedir consultas ou buscas.

## Gerar a amostra

Na raiz, com Python 3 e Pillow instalado (`python3-pil`):

```bash
python3 deploy/gerar-amostra.py
```

A seleção usa uma semente fixa, distribui as obras pelos estilos e pula arquivos
inexistentes ou ilegíveis. O gerador recusa um diretório de saída não vazio.
Para revisar uma nova amostra sem sobrescrever a atual:

```bash
python3 deploy/gerar-amostra.py --saida deploy/catalogo-revisao
```

Os caminhos no CSV incluem o diretório de saída. Ao adotar uma amostra gerada
em outro diretório, ajuste também o `COPY` e `WIKIART_CATALOGO` no Docker.
Versione apenas a amostra adotada. Não adicione `data/archive` ou o catálogo
completo ao pacote de produção. `.dockerignore` exclui toda a pasta `data`;
o Docker copia somente a amostra para a imagem final.

## Atualizar o Render

1. Envie as alterações de código e `deploy/catalogo` ao repositório.
   Os CSVs locais já modificados antes desta tarefa não fazem parte da correção.
2. Mantenha o serviço Docker com raiz do repositório, `./Dockerfile` e health
   check `/api/periodos`. O `render.yaml` já aponta para a amostra incorporada.
3. No serviço existente, configure `WIKIART_CATALOGO` como
   `/app/deploy/catalogo/classes.csv` ou remova a variável para usar o padrão
   do Docker. Remova os antigos `WIKIART_CATALOGO_URL` e
   `WIKIART_CATALOGO_SHA256`: a amostra não depende mais de downloads da release.
4. Mantenha `WIKIART_THUMBNAILS=/tmp/wikiart/thumbnails` (padrão do Docker).
   Não use um cache de miniaturas do catálogo completo com os IDs da amostra.
5. Faça o redeploy da API. `PORT` continua sendo repassada para `SERVER_PORT`.

O script mantém suporte ao download HTTPS do CSV para instalações que
explicitamente precisem dele. Essa opção baixa apenas metadados, sem imagens;
para o site publicado, use o catálogo incorporado ao Docker.

## Atualizar a Vercel

Mantenha Root Directory `frontend`, Node.js 22.x, instalação `npm ci`, build
`npm run build` e saída `dist`. Faça o redeploy após atualizar a API.

O primeiro rewrite de `frontend/vercel.json` encaminha `/api/:path*` para
`https://ed2-busca.onrender.com/api/:path*`. Se a URL da API mudar, atualize
esse destino. As demais regras preservam o acesso direto às páginas do site.
O placeholder SVG é servido pela própria Vercel e pelo frontend do JAR local.

## Validação

Build, testes unitários, tipos, lint e cobertura:

```bash
./mvnw verify
```

Para testar a amostra com o JAR local (execute na raiz):

```bash
WIKIART_CATALOGO=deploy/catalogo/classes.csv \
WIKIART_THUMBNAILS=/tmp/wikiart-amostra-thumbnails \
java -jar target/wikiart-catalogo-1.0.0-SNAPSHOT.jar
```

Em outro terminal, com Chromium do Playwright instalado:

```bash
cd frontend
WIKIART_E2E_AMOSTRA=1 npx playwright test producao.spec.ts
```

Depois do redeploy, confira `/api/periodos` e `/api/obras` (540 registros),
`/api/imagens/0/miniatura` e `/api/imagens/0/original` (JPEG), abra e recarregue
`/acervo`, `/buscar`, `/estruturas`, `/museu` e `/sobre`, faça duas buscas pela
mesma obra e confira os acumulados, os detalhes e os destaques. As sessões
continuam em memória e são apagadas ao reiniciar o backend.
