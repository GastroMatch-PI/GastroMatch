# Receita para o Render (e qualquer host com Docker) montar e rodar a API.
# O banco NÃO entra aqui: ele é o Supabase, ligado por variáveis de ambiente.

# Fase 1: compila o projeto com Maven e Java 21.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src src
# Os testes rodam no CI do GitHub; aqui só empacota.
RUN mvn -q -DskipTests package

# Fase 2: imagem final só com o Java para rodar (menor e mais segura).
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN useradd --system app
USER app
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
# 75% da memória do contêiner para o Java: o plano grátis do Render tem só 512 MB.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
