# Boiler-Mono: Production-Ready Chat Boilerplate

현대적인 기술 스택으로 구성된 프로덕션 레벨 실시간 채팅 애플리케이션 보일러플레이트입니다.

## 🚀 Core Features

### Frontend (Next.js)
- **Next.js 14**: App Router 기반의 최신 리액트 프레임워크
- **TypeScript**: 타입 안정성을 통한 높은 코드 품질 유지
- **BFF (Backend-for-Frontend)**: `/api/bridge/*` 경로를 통해 백엔드 API를 안전하게 호출하는 프록시 패턴 적용
- **SWR**: 데이터 페칭 및 캐싱, 상태 관리
- **`@chatstack/ui`**: `packages/ui`에 위치한 내부 UI 컴포넌트 라이브러리

### Backend (Spring Boot)
- **도메인 중심 아키텍처**: `user`, `message`, `files` 등 기능별로 명확하게 분리된 구조
- **REST APIs**: 사용자 인증(회원가입/로그인), 메시지(CRUD) 등 필수 기능 제공
- **실시간 채팅**: SSE (Server-Sent Events)와 Redis Pub/Sub를 이용한 수평 확장 가능한 실시간 메시지 스트리밍
- **JWT 기반 인증**: `Bearer` 토큰을 사용한 안전한 인증/인가
- **JPA/Hibernate & PostgreSQL**: 표준 ORM 및 RDB 사용
- **Flyway**: 안정적인 데이터베이스 스키마 버전 관리

### Production-Ready Patterns
- **Idempotency-Key**: Redis를 이용한 요청 중복 실행 방지 필터
- **Correlation-ID**: 모든 로그에 요청 ID를 포함하여 추적 용이성 확보
- **Global Exception Handling**: 일관된 형식의 오류 응답
- **S3/MinIO Integration**: Presigned URL을 활용한 효율적이고 안전한 파일 업로드
- **Scheduled Job**: 주기적으로 오래된 메시지를 삭제하는 스케줄러

### Observability
- **OpenTelemetry (OTLP)**: 분산 추적(Tracing) 표준
- **Micrometer & Prometheus**: 표준 메트릭 수집
- `docker-compose.yml`을 통해 Jaeger, Prometheus, Grafana 등 로컬 대시보드 제공

### DevOps
- **Docker Compose**: 로컬 개발에 필요한 모든 인프라(DB, Redis, OpenSearch 등)를 한 번에 실행
- **GitHub Actions**: CI (빌드, Docker 이미지 생성, Trivy 보안 스캔) 워크플로우 포함
- **Kubernetes & Helm**: K8s 배포를 위한 매니페스트 및 Helm 차트 제공

---

## 🏁 Getting Started

**Prerequisites**: Java 21, Node.js (v20+), pnpm, Docker

**1. Install Dependencies**

프로젝트 최상단에서 모든 워크스페이스의 의존성을 설치합니다.
```bash
pnpm install
```

**2. Run Infrastructure**

로컬 개발에 필요한 데이터베이스, Redis, MinIO 등을 실행합니다.
```bash
docker compose -f infra/docker-compose.yml up -d
```

**3. Run Applications**

각각의 터미널에서 백엔드와 프론트엔드 애플리케이션을 실행합니다.

- **Backend (Spring Boot):**
  ```bash
  ./gradlew bootRun
  ```

- **Frontend (Next.js):**
  ```bash
  pnpm dev --filter chatstack-web
  ```

이제 프론트엔드는 `http://localhost:3000`, 백엔드 API는 `http://localhost:9094`에서 접근할 수 있습니다.

---

## 📖 API Quick Guide

- **Auth**
  - `POST /auth/register`
  - `POST /auth/login`

- **Messages (REST)**
  - `GET /api/messages`
  - `POST /api/messages`

- **Messages (Real-time Stream)**
  - `GET /api/messages/stream/{roomId}` (SSE)

- **File Upload Flow**
  1. `POST /api/files/presign`: 업로드할 파일 정보를 보내고 Presigned URL을 받습니다.
  2. (Client) 응답받은 URL로 S3/MinIO에 파일을 직접 업로드합니다.
  3. `POST /api/files/attach`: 업로드 완료 후, 파일 정보를 서버에 등록하여 메시지와 연결합니다.

---

## ⚙️ Environment Variables

`application.yml` 또는 환경 변수를 통해 아래 값들을 설정할 수 있습니다.

### Backend (`application.yml` or System Environment)

```bash
# JWT
JWT_SECRET=your-super-strong-jwt-secret

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

# Sentry (Optional)
SENTRY_DSN=
```

### Frontend (`app/frontend/.env.local`)

프론트엔드 앱의 백엔드 API 주소를 설정합니다. `app/frontend` 디렉토리에 `.env.local` 파일을 생성하여 아래 내용을 추가하세요。

```bash
# 백엔드 API 서버 주소 (HTTP 및 WebSocket 연결에 사용)
NEXT_PUBLIC_SPRING_BASE_URL=http://localhost:9094
```
