FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn --batch-mode -Dexec.skip=true -DskipTests package

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 wikiart
WORKDIR /app
COPY --from=build /build/target/wikiart-catalogo-1.0.0-SNAPSHOT.jar /app/app.jar
COPY deploy/start-backend.sh /app/start-backend.sh
USER wikiart
ENV WIKIART_CATALOGO=/tmp/wikiart/classes.csv \
    WIKIART_THUMBNAILS=/tmp/wikiart/thumbnails \
    JAVA_TOOL_OPTIONS="-Xms64m -Xmx320m -XX:+ExitOnOutOfMemoryError -Djava.awt.headless=true"
EXPOSE 8080
ENTRYPOINT ["sh", "/app/start-backend.sh"]
