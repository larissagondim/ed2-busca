# Deploy com frontend na Vercel

## Estado atual

`frontend/vercel.json` configura o build Vite e os endereços das páginas.
A API tem `Dockerfile`, `deploy/start-backend.sh` e `render.yaml` preparados
para Render Free, mas ainda precisa ser publicada e obter uma URL HTTPS. Sem o proxy
descrito abaixo, a interface publicada não consegue carregar o catálogo.

## Frontend

Importe o repositório na Vercel e configure:

| Campo | Valor |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Node.js Version | 22.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

O proxy em `vite.config.ts` funciona apenas no desenvolvimento local.

Quando o backend tiver uma URL, adicione a regra abaixo como primeiro elemento
de `rewrites` em `frontend/vercel.json`, substituindo o domínio de exemplo:

```json
{
  "source": "/api/:path*",
  "destination": "https://SEU-BACKEND.example/api/:path*"
}
```

As requisições continuam no domínio do frontend. Mantenha cookies sem um
`Domain` exclusivo do backend e não habilite cache compartilhado nos endpoints
de sessão e busca. Valide a persistência da sessão no deploy antes de publicar
o endereço: selecionar um período e executar duas buscas deve manter o filtro
e incrementar os acumulados.

## Render Free e catálogo fora dos commits

O plano gratuito oferece 512 MB de RAM. O Docker limita o heap Java a 320 MB
para reservar espaço para a JVM. A capacidade real depende das sessões ativas.
O serviço dorme após 15 minutos sem tráfego; reinicializações apagam as sessões,
as métricas em memória e os arquivos temporários. O catálogo é baixado novamente
ao iniciar. A primeira visita pode demorar enquanto o serviço acorda.

1. Abra as Releases do repositório no GitHub e crie uma release para o catálogo,
   por exemplo com a tag `catalogo-2026-10-02`.
2. Anexe `data/deploy/classes.csv.gz` e `data/deploy/classes.csv.sha256`.
   Esses arquivos não precisam de `git add`: são anexos da release, não arquivos
   de um commit. O repositório precisa ser público para usar a URL sem credenciais.
3. No Render, crie um Web Service ligado ao repositório. Escolha Docker, deixe
   a raiz do serviço na raiz do repositório, use `./Dockerfile` e selecione **Free**.
   Alternativamente, importe o `render.yaml` como Blueprint.
4. Configure as variáveis abaixo e use `/api/periodos` como Health Check Path.
5. Publique o serviço, copie sua URL HTTPS e configure o proxy da Vercel.

| Variável no Render | Valor |
| --- | --- |
| `WIKIART_CATALOGO_URL` | URL de download do anexo `classes.csv.gz` |
| `WIKIART_CATALOGO_SHA256` | Hash do CSV descompactado, em `classes.csv.sha256` |

Se usar a tag sugerida no repositório atual, a URL será:

```text
https://github.com/larissagondim/ed2-busca/releases/download/catalogo-2026-10-02/classes.csv.gz
```

A URL só funciona depois de publicar a release e anexar o arquivo. Não use
a URL de uma página de visualização; o script precisa baixar o gzip diretamente.
O build do backend não incorpora os CSVs versionados nem as imagens. A imagem
Docker exclui `data/` do contexto de build e usa o catálogo externo configurado.

O script aceita apenas downloads HTTPS, verifica o hash configurado e só
inicia a aplicação depois de baixar e descompactar o catálogo com sucesso.
O Render fornece `PORT`; o script repassa esse valor para `SERVER_PORT`.

Na validação local com o Docker limitado a 512 MB e 0,1 CPU, o catálogo de
81.444 obras iniciou em aproximadamente 3 minutos e 18 segundos. Uma busca
com as nove estratégias retornou HTTP 200; a memória observada depois de criar
uma sessão foi aproximadamente 285 MB. Isso valida um uso básico, não garante
capacidade para muitas sessões simultâneas nem o tempo de inicialização no Render.

## Comportamento do backend

O backend atual mantém as estruturas e as sessões HTTP na memória. Use uma
única instância para preservar o comportamento enquanto o processo estiver ativo;
reiniciar a aplicação ainda apaga essas sessões. Escalar para várias instâncias
exige uma estratégia adicional para o estado.

O pacote local `data/deploy/catalogo.tar.gz`, ignorado pelo Git, contém os CSVs,
instruções e hashes SHA-256. Guarde uma cópia em armazenamento externo e extraia
no servidor Java. Esse pacote ainda não foi enviado para a nuvem.

Exemplo de execução com catálogo extraído em `/srv/wikiart/data`:

```bash
WIKIART_CATALOGO=/srv/wikiart/data/classes.csv \
WIKIART_THUMBNAILS=/srv/wikiart/data/thumbnails \
SERVER_PORT=8080 \
java -jar target/wikiart-catalogo-1.0.0-SNAPSHOT.jar
```

## Imagens

As imagens locais ocupam aproximadamente 32 GB e não estão no pacote dos CSVs.
O código atual lê arquivos do disco; ele não lê URLs de um bucket diretamente.
Para usar as imagens sem alterar o código, disponibilize `data/archive` no
diretório de execução do backend, preservando os caminhos relativos do CSV, e
permita escrita no diretório de miniaturas.

Sem os JPGs, o catálogo e as buscas funcionam, mas as imagens retornam 404.
Para servir imagens por armazenamento de objetos, será necessário adaptar a
integração de imagens e escolher o armazenamento antes do upload.

## Verificação após conectar a API

1. Abrir `/api/periodos`: deve responder JSON, não HTML.
2. Abrir `/museu` diretamente e recarregar: a página deve abrir.
3. Selecionar um período e executar duas buscas: filtro e acumulados devem persistir.
4. Abrir detalhes e verificar recentes e mais vistas.
5. Se os JPGs estiverem no servidor, verificar uma miniatura e um original.

## Referências

- [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Proxy por rewrites](https://vercel.com/docs/routing/rewrites)
- [Containers na Vercel, em beta](https://vercel.com/docs/functions/container-images)
- [Limites e preços do Vercel Blob](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Render gratuito e suas limitações](https://render.com/docs/free)
- [Render Compute Plans](https://render.com/docs/compute-plans)
- [Docker no Render](https://render.com/docs/docker)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
