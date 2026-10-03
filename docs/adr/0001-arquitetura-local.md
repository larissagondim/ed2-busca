# ADR 0001: aplicação local sem banco

## Decisão

Spring Boot serve API JSON e o React estático no mesmo JAR. O CSV é carregado uma vez nas estruturas do próprio projeto: árvore afunilada por ID, Skip Lists indexáveis por ID, código e título (global e por estilo) e árvore afunilada de estilos. Recentes e ranking de mais vistas são globais à aplicação. Cada sessão mantém somente um `MotorDeBuscas`, recriado ao mudar filtro. Imagens permanecem em disco e o caminho servido é sempre o registrado na obra, nunca um caminho vindo da requisição.

## Consequências

Não há banco ou deploy. Usa-se mais memória por sessão em troca de isolamento. O frontend permanece substituível e o artefato final é um JAR executável.
