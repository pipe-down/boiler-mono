# Chatstack Prod
**실서비스 필수 추가 번들**

## 포함 기능
- Redis Pub/Sub **크로스노드 브로드캐스트**
- **Idempotency-Key**(Redis) 중복 방지
- **RFC 7807** 전역 예외 응답 / 문제세부
- **Correlation-ID** 필터 + **JSON 구조화 로깅**
- **OpenTelemetry**(OTLP) + **Micrometer/Prometheus** + Jaeger 대시보드
- **Resilience4j** 회로차단/재시도
- **S3/MinIO 파일 스토리지**(프리사인 URL) + 첨부 테이블
- **메시지 보존기간** 스케줄러 삭제
- **Sentry**(옵션 DSN)
- **Helm 차트**, **GitHub Actions**(빌드/도커/Trivy), **K8s Ingress**

## 추가 인프라 기동
```bash
docker compose -f infra/docker-compose.yml up -d
```

## ENV (추가)
```bash
# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
MANAGEMENT_PROMETHEUS_ENABLED=true

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=chat-attachments
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_PATH_STYLE=true

# Idempotency
IDEMP_TTL_SEC=120

# Retention
MESSAGE_RETENTION_DAYS=90

# Sentry (옵션)
SENTRY_DSN=
```

## 파일 업로드 흐름
1) `POST /files/presign` → `{ key, url, headers }` 응답  
2) 프런트에서 PUT 업로드 → `POST /files/attach` 로 메시지와 연결

---