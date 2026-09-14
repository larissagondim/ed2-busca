# ADR 0001: aplicação local sem banco

## Decisão

Spring Boot serve API JSON e o React estático no mesmo JAR. O CSV é carregado uma vez e indexado por ID, código e período. Cada sessão mantém somente um `MotorDeBuscas`, recriado ao mudar filtro. Imagens permanecem em disco e passam por uma lista de caminhos registrados.

## Consequências

Não há banco ou deploy. Usa-se mais memória por sessão em troca de isolamento. O frontend permanece substituível e o artefato final é um JAR executável.
