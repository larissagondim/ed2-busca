# Especificação: interface web

A interface React é organizada em páginas com endereço próprio, servidas pelo `SpaController`:

- **Início (`/`)**: busca rápida por ID ou código (executa as oito buscas), mapa das três estruturas de dados e as listas mantidas por elas (vistas recentemente, mais vistas e artistas mais vistos, derivados das visualizações agregadas na AVL e ordenados no frontend).
- **Buscar (`/buscar`)**: painel único com período da sessão, obra e estratégias agrupadas por estrutura; resultado ordenado por comparações, com a melhor busca de cada estrutura e atalho para a animação de cada uma; resumo acumulado (recolhido até a segunda busca); e as seis outras consultas (artista, piso, teto, intervalo, menor e maior chave); a consulta por artista mostra lado a lado as comparações da busca sequencial e da Árvore AVL. Permite reiniciar a sessão.
- **Artistas (`/artistas`)**: artistas em ordem alfabética paginados pela Árvore AVL, busca por nome (sem distinção de acentos e maiúsculas) e, ao abrir um artista, as obras dele nos mesmos cartões e painel de detalhes do acervo, com "encontrado em X comparações, profundidade Y na AVL".
- **Estruturas (`/estruturas`)**: painel "Estruturas por dentro" com números grandes (altura AVL x ABB, comparações médias de busca, rotações por tipo, tamanho e níveis das Skip Lists e das listas de destaque, vindos de `/api/estruturas`), papel de cada estrutura no projeto e simulação passo a passo das oito buscas, agrupadas por estrutura; `?busca=TIPO` abre uma estratégia.
- **Acervo (`/acervo`)**: obras por período com paginação; cada obra vira para mostrar os dados, pode ser ampliada e enviada para a busca.
- **Museu (`/museu`)**: salas por estilo em ordem histórica, com busca animada dentro de cada sala.
- **Sobre (`/sobre`)**: origem dos dados, como o catálogo é guardado, como ler as métricas e como funciona a sessão.

Abrir detalhes registra a visualização. Mostra carregamento, vazio e erro; funciona por teclado (atalho `/` leva à busca); possui foco visível, rótulos, HTML semântico e respeita `prefers-reduced-motion`; tem modo escuro (segue o sistema ou a escolha salva no cabeçalho). Endereços antigos (`/catalogo`, `/resumo`) continuam válidos.

## Aceitação

- Ao carregar, período, grade e paginação do acervo são operáveis.
- Ao buscar ID/código, a comparação aparece ou um erro acessível é anunciado.
- Cada página pode ser aberta diretamente pelo endereço.
- Em tela estreita não há rolagem horizontal da página.
- Ao abrir `/artistas`, a primeira página lista os artistas em ordem alfabética; abrir um artista mostra as obras e as comparações da AVL.
- Em `/estruturas`, as alturas da AVL e da ABB e as quatro contagens de rotação aparecem em destaque.
