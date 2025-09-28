plugins {
  id("java")
  id("org.springframework.boot") version "3.3.3"
  id("io.spring.dependency-management") version "1.1.5"
  id("org.flywaydb.flyway") version "10.17.0"
  id("org.openapi.generator") version "7.7.0"
}

val openApiOutputDir = layout.buildDirectory.dir("generated/openapi")

tasks.register<org.openapitools.generator.gradle.plugin.tasks.GenerateTask>("genServer") {
  inputSpec.set("$rootDir/specs/openapi.yaml")
  generatorName.set("spring")
  outputDir.set(openApiOutputDir.get().asFile.toString())
  apiPackage.set("com.example.app.api")
  modelPackage.set("com.example.app.api.model")
  invokerPackage.set("com.example.app.api.invoker")
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

group="com.example.chat"; version="0.5.0"
java { toolchain { languageVersion.set(JavaLanguageVersion.of(21)) } }
repositories { mavenCentral() }
dependencies {
  implementation("org.springframework.boot:spring-boot-starter-webflux")
  implementation("org.springframework.boot:spring-boot-starter-validation")
  implementation("org.springframework.boot:spring-boot-starter-actuator")
  implementation("org.springframework.boot:spring-boot-starter-data-jpa")
  implementation("org.postgresql:postgresql:42.7.3")

  implementation("org.springframework.boot:spring-boot-starter-security")
  implementation("io.jsonwebtoken:jjwt-api:0.11.5")
  runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
  runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")

  implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.6.0")

  implementation("org.springframework.boot:spring-boot-starter-data-redis")
  implementation("org.apache.kafka:kafka-clients:3.7.0")
  implementation("org.springframework.kafka:spring-kafka:3.1.3")
  implementation("org.opensearch.client:opensearch-rest-client:2.11.1")

  // Observability
  implementation("io.micrometer:micrometer-registry-prometheus:1.13.4")
  implementation("io.micrometer:micrometer-tracing-bridge-otel:1.3.4")
  implementation("io.opentelemetry:opentelemetry-exporter-otlp:1.44.1")

  // Resilience4j
  implementation("io.github.resilience4j:resilience4j-spring-boot3:2.2.0")

  // S3
  implementation("software.amazon.awssdk:s3:2.26.22")

  // Sentry (optional)
  implementation("io.sentry:sentry-spring-boot-starter-jakarta:7.13.0")
  implementation("io.sentry:sentry-logback:7.13.0")
  
  // Logstash
  implementation("net.logstash.logback:logstash-logback-encoder:7.4")

  testImplementation("org.springframework.boot:spring-boot-starter-test")
}
flyway {
  url = System.getenv("JDBC_URL") ?: "jdbc:postgresql://localhost:5432/chatdb"
  user = System.getenv("JDBC_USER") ?: "chat"
  password = System.getenv("JDBC_PASSWORD") ?: "chatpw"
  locations = arrayOf("filesystem:src/main/resources/db/migration")
}