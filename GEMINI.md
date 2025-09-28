# AGENTS.md — Chatstack Monorepo 운영 가드레일 (Spec-Driven)

본 문서는 스펙(OpenAPI/AsyncAPI/Figma) → 코드 생성/구현/검증 → 배포까지의 **일관된 작업 방식**과
**Codex CLI** 사용 시 지켜야 할 **가드레일**을 정의한다.

## 0) 목적 & 원칙
- **스펙 우선(SSOT)**: API/UI/이벤트는 스펙이 단일 진실 소스. 모든 구현/테스트/문서는 스펙을 따른다.
- **계약 준수**: 서버·클라이언트·문서 간 **드리프트 금지**. PR 시 자동 게이트로 검증한다.
- **명확한 경계**: Controller ↔ Service ↔ Repository, UI ↔ BFF ↔ Backend 경계 책임을 섞지 않는다.
- **가독성·테스트 우선**: 빠른 구현보다 읽기 쉬운 코드와 충분한 테스트를 우선한다.

## 1) 저장소 구조(요지)
```
apps/
  backend/            # Spring Boot 3, JPA, Flyway, Actuator, Springdoc
  web/                # Next.js(App Router), BFF 프록시(/api/bridge/*)
packages/
  ui/                 # 디자인 시스템(@chatstack/ui)
  sdk/                # OpenAPI 타입/클라이언트 스캐폴드
  generator/          # 도메인/화면 제너레이터(Plop)
specs/
  openapi.yaml        # REST 계약(SSOT)
  asyncapi.yaml       # 이벤트 계약(선택)
  schemas/            # 공용 JSON Schema
  ui/figma.txt        # Figma Dev Mode 링크/참조
GUIDE.md              # 개발/배포 가이드
AGENTS.md             # 본 문서
```

## 2) 스펙 규칙 (OpenAPI/AsyncAPI/Figma)
### OpenAPI
- `tags`는 도메인 단위(예: `messages`, `users`).
- DTO는 `components/schemas`에 정의하고 가능한 재사용한다.
- 페이지네이션 응답은 `Page<T>` 형태(`content`, `totalElements`, `number`, `size`, `totalPages`)로 표준화한다.
- 검색/페이징/정렬 파라미터:
  - `q`(검색어), `page`(0-base), `size`(기본 20, 최대 200),
  - `sort="field,asc|desc;field2,asc|desc"`.
- 호환성 변경은 `breaking` 라벨과 함께 버전을 명시(예: `/v1/...`).

### AsyncAPI(선택)
- 토픽 명, 메시지 스키마, 파티션 키, 에러 채널을 정의한다.

### Figma
- 컴포넌트/토큰 명명 규칙: `kebab-case`(토큰), `PascalCase`(컴포넌트).
- 디자인 토큰은 `@chatstack/ui` 토큰으로 매핑 가능해야 한다.

## 3) 코드 생성 & 드리프트 방지
### Backend Stub (OpenAPI Generator)
- 생성물: **컨트롤러 인터페이스**/모델. 구현은 우리 코드에서(생성물 직접 수정 금지).
- 예시 Gradle 태스크는 `tools/openapi/openapi.gradle.kts` 참고.

### Frontend SDK 타입
- `pnpm sdk:gen && pnpm sdk:build` 또는 로컬 스펙 기준 `pnpm sdk:gen:spec` 사용.

### Spec Gate(PR 체크)
1) `gradle genServer` → `git diff --exit-code` (변경 있으면 실패)  
2) `pnpm sdk:gen:spec` → `git diff --exit-code` (변경 있으면 실패)  
3) `./gradlew test` 통과

## 4) 백엔드 아키텍처
- 레이어: Controller(web) / Service(도메인 규칙) / Repository(영속성)
- 유틸: `Pageing.of(page,size,sort)`, `Specs.textLike(q, ...)`
- 예외/검증/로그: `@RestControllerAdvice`, Bean Validation, `X-Request-ID`
- 보안: JWT(HMAC256), `/auth/**`/health/openapi/actuator 허용
- 데이터/DDL: Flyway, `open-in-view=false`

## 5) 프론트 아키텍처
- BFF 프록시: `/api/bridge/*` → Backend
- 상태/데이터: SWR + 전역 fetcher(`lib/fetcher.ts`)로 JWT 자동 첨부
- 디자인 시스템: `@chatstack/ui` 우선, Table/Pagination/AutoForm 표준화
- 라우팅: App Router + Guard/HOC

## 6) 제너레이터 규정
- Backend: Entity/Repo(Service+Search)/Controller(Page+Search)+Flyway
- Frontend: list/new(AutoForm+_schema.ts)/detail
- 생성물 레이어 규칙 훼손 금지, OpenAPI 스텁 직접 수정 금지
- `_schema.ts` 메타(`label`,`required`,`options`,`widget`) 확장 가능

## 7) 테스트
- 유닛(서비스), 슬라이스(JPA/WebMvc), 통합(Testcontainers), 컨트랙트(OpenAPI 스냅샷)

## 8) 관찰성/운영
- Actuator, JSON 로그, OTEL/Prometheus/Jaeger 프로필 기반

## 9) 성능/회복탄력성
- 타임아웃/재시도/서킷 브레이커는 클라이언트 우선
- 페이징 기본 20, 상한 200

## 10) 보안/비밀
- 비밀은 환경변수/시크릿 매니저로만, 레포 커밋 금지
- CORS는 BFF 경유, 입력 검증/출력 인코딩 기본

## 11) Git/릴리즈/CI
- 브랜치: main 보호, 기능 브랜치 → PR
- PR 체크리스트: 스펙 동기화, 테스트, 문서 갱신
- 릴리즈: changesets + semver

## 12) Codex CLI
- 권장 프롬프트: “`specs/openapi.yaml` 기준, tag=messages 구현. 생성된 인터페이스 구현, 서비스/리포 패턴 유지, AGENTS.md 준수. 테스트 추가 후 ./gradlew test.”
- 비대화: `codex exec "..."`를 CI에서 사용
- MCP(선택): Figma Dev Mode, Snyk 등

## 13) 로컬 개발 런북
```
corepack enable && pnpm i
docker compose -f infra/docker-compose.yml up -d
# Backend
cd apps/backend && ./gradlew bootRun
# Frontend
cd ../../apps/web && SPRING_BASE_URL=http://localhost:9094 pnpm dev
```
- 스펙 변경 → `genServer`/`sdk:gen:spec` → 구현/테스트 → PR

## 14) FAQ
- 항상 **스펙 먼저**. 드리프트 발견 시 재생성 + 커밋. 폼은 `_schema.ts` 메타 확장으로 자동화.
