export type Obra={id:number;codigoAcervo:string;titulo:string;artista:string;estilo:string;caminhoImagem:string}
export type Periodo={slug:string;nome:string;quantidade:number}
export type Pagina={conteudo:Obra[];pagina:number;tamanho:number;totalElementos:number;totalPaginas:number}
export type Medicao={tipo:string;nome:string;encontrou:boolean;comparacoes:number;reorganizacoes:number;tempoMicros:number;cpuMicros:number|null}
export type Acumulado={tipo:string;nome:string;buscas:number;sucessos:number;comparacoes:number;reorganizacoes:number;eficaciaPercentual:number;mediaComparacoes:number;mediaTempoMicros:number;mediaCpuMicros:number|null}
export type Resumo={periodo:string|null;quantidadeObras:number;estrategias:Acumulado[]}
export type Comparacao={obra:Obra;medicoes:Medicao[];resumo:Resumo}
export type Comparativo={comparacoesSequencial:number;comparacoesAvl:number;tempoSequencialMicros:number;tempoAvlMicros:number;mesmoResultado:boolean}
export type Consulta={tipo:string;nome:string;obras:Obra[];total:number;comparacoes:number;tempoMicros:number;comparativo?:Comparativo|null}
export type PedidoConsulta={tipo:string;artista?:string;inicio?:number;fim?:number}
export type Artista={nome:string;quantidadeObras:number;visualizacoes:number;posicao:number}
export type Destaques={recentes:Obra[];maisVistas:{obra:Obra;visualizacoes:number}[];artistasVistos?:Artista[]}
export type PaginaArtistas={conteudo:Artista[];pagina:number;tamanho:number;totalElementos:number;totalPaginas:number}
export type ObrasDoArtista={artista:Artista;conteudo:Obra[];pagina:number;tamanho:number;totalElementos:number;totalPaginas:number;comparacoes:number;profundidade:number}
export type Rotacoes={simplesEsquerda:number;simplesDireita:number;duplaEsquerdaDireita:number;duplaDireitaEsquerda:number}
export type MetricasArvores={artistas:number;alturaAvl:number;alturaAbb:number;alturaMinimaTeorica:number;rotacoes:Rotacoes;comparacoesMediasAvl:number;comparacoesMediasAbb:number;obras:number}
export type SkipListInfo={nome:string;tamanho:number;niveis:number}
export type Estruturas={skipLists:SkipListInfo[];recentes:number;capacidadeRecentes:number;maisVistas:number;arvores:MetricasArvores}
async function requisitar<T>(url:string,init?:RequestInit):Promise<T>{const resposta=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...init?.headers},...init});if(!resposta.ok){const erro=await resposta.json().catch(()=>({mensagem:'Falha ao acessar o servidor.'}));throw new Error(erro.mensagem??'Falha ao acessar o servidor.')}return resposta.status===204?undefined as T:resposta.json()}
export const api={periodos:()=>requisitar<Periodo[]>('/api/periodos'),obras:(periodo:string,page:number)=>requisitar<Pagina>(`/api/obras?page=${page}&size=24&ordem=id${periodo?`&periodo=${encodeURIComponent(periodo)}`:''}`),selecionar:(slug:string)=>requisitar<Resumo>(`/api/sessao/periodo/${slug||'global'}`,{method:'PUT'}),comparar:(tipo:'ID'|'CODIGO',valor:string,estrategias?:string[])=>requisitar<Comparacao>('/api/buscas/comparar',{method:'POST',body:JSON.stringify({tipo,valor,estrategias})}),resumo:()=>requisitar<Resumo>('/api/sessao/resumo'),reiniciar:()=>requisitar<void>('/api/sessao',{method:'DELETE'}),destaques:()=>requisitar<Destaques>('/api/destaques?limite=8'),consultar:(pedido:PedidoConsulta)=>requisitar<Consulta>('/api/buscas/consulta',{method:'POST',body:JSON.stringify(pedido)}),visualizar:(id:number)=>requisitar<Destaques>(`/api/obras/${id}/visualizacoes?limite=8`,{method:'POST'}),
artistas:(page:number)=>requisitar<PaginaArtistas>(`/api/artistas?page=${page}&size=24`),
obrasDoArtista:(nome:string,page:number)=>requisitar<ObrasDoArtista>(`/api/artistas/${encodeURIComponent(nome)}/obras?page=${page}&size=24`),
estruturas:()=>requisitar<Estruturas>('/api/estruturas')}
