plugins {
    id("java")
    kotlin("jvm") version "1.9.24"
    id("org.springframework.boot") version "3.4.5"
    id("io.spring.dependency-management") version "1.1.8"
    kotlin("kapt") version "1.9.24"
    id("org.flywaydb.flyway") version "10.17.0"
    id("org.openapi.generator") version "7.7.0"
}

val openApiOutputDir = layout.buildDirectory.dir("generated/openapi")

tasks.register<org.openapitools.generator.gradle.plugin.tasks.GenerateTask>("genServer") {
    inputSpec.set("$rootDir/specs/openapi.yaml")
    generatorName.set("spring")
    outputDir.set(openApiOutputDir.get().asFile.toString())
    apiPackage.set("com.getmoim.backend.api")
    modelPackage.set("com.getmoim.backend.api.model")
    invokerPackage.set("com.getmoim.backend.api.invoker")
    configOptions.set(mapOf(
        "useSpringBoot3" to "true",
        "dateLibrary" to "java8",
        "interfaceOnly" to "true",
        "performBeanValidation" to "true"
    ))
}

extensions.configure<org.gradle.api.tasks.SourceSetContainer>("sourceSets") {
    named("main") {
        java.srcDir(openApiOutputDir.map { it.dir("src/main/java").asFile })
    }
}

group = "com.getmoim"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-websocket")

    // Database & Query
    implementation("org.postgresql:postgresql:42.7.3")
    implementation("com.querydsl:querydsl-jpa:5.1.0:jakarta")
    kapt("com.querydsl:querydsl-apt:5.1.0:jakarta")
    implementation("com.querydsl:querydsl-core:5.1.0")


    // Caching
    implementation("com.github.ben-manes.caffeine:caffeine")

    // Security
    implementation("com.auth0:java-jwt:4.4.0")

    // API Documentation
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

    // Messaging
    implementation("org.springframework.kafka:spring-kafka")
    implementation("org.apache.kafka:kafka-clients")

    // Search
    implementation("org.opensearch.client:opensearch-rest-client:2.11.1")

    // Observability
    implementation("io.micrometer:micrometer-registry-prometheus:1.13.4")
    implementation("io.micrometer:micrometer-tracing-bridge-otel:1.3.4")
    implementation("io.netty:netty-resolver-dns-native-macos:4.1.112.Final:osx-aarch_64")
    implementation("io.opentelemetry:opentelemetry-exporter-otlp:1.44.1")

    // Resilience
    implementation("io.github.resilience4j:resilience4j-spring-boot3:2.2.0")

    // AWS S3
    implementation(platform("software.amazon.awssdk:bom:2.26.22"))
    implementation("software.amazon.awssdk:s3")
    implementation("software.amazon.awssdk:kms")


    // Sentry
    implementation("io.sentry:sentry-spring-boot-starter-jakarta:7.13.0")
    implementation("io.sentry:sentry-logback:7.13.0")

    // Logging
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")

    // Utilities
    implementation("org.projectlombok:lombok:1.18.30")
    kapt("org.projectlombok:lombok:1.18.30")
    implementation("com.google.guava:guava:32.1.2-jre")


    // Test Dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:testcontainers:1.19.7")
    testImplementation("org.testcontainers:junit-jupiter:1.19.7")
    testImplementation("org.testcontainers:postgresql:1.19.7")
    testImplementation("org.testcontainers:kafka:1.19.7")
    testImplementation("org.testcontainers:elasticsearch:1.19.7")
    testImplementation("org.mock-server:mockserver-netty:5.15.0")
    testImplementation("org.mock-server:mockserver-client-java:5.15.0")
    testImplementation("io.rest-assured:rest-assured:5.4.0")
}

kapt {
    arguments {
        arg("jakarta.persistence.query.jpa.querydsl.JPAAnnotationProcessor")
    }
}

flyway {
  url = System.getenv("JDBC_URL") ?: "jdbc:postgresql://localhost:5432/chatdb"
  user = System.getenv("JDBC_USER") ?: "chat"
  password = System.getenv("JDBC_PASSWORD") ?: "chatpw"
  locations = arrayOf("filesystem:src/main/resources/db/migration")
}
