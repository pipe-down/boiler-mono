# Chatstack Project — 개발 가이드

## 목표
- 도메인/화면을 **제너레이터**로 즉시 생성
- **검색/정렬/페이징** 공통 규약
- **JWT 인증 / 가드** 기본 내장
- **OpenAPI 타입**/SDK 생성 파이프라인
- **Storybook + changesets + CI/CD + k8s** 배포 템플릿

---

## 1) 로컬 개발
```bash
# 1. 의존성 설치
pnpm i

# 2. 데이터베이스 및 인프라 실행
docker compose -f infra/docker-compose.yml up -d

# 3. 백엔드 실행 (프로젝트 루트에서)
./gradlew :app:backend:bootRun
# 또는 pnpm dev:backend
# 확인: http://localhost:9094/api/health

# 4. 프론트엔드 실행 (프로젝트 루트에서)
pnpm dev:web
# 확인: http://localhost:3000
```

## 2) 인증
- 회원가입: `POST /auth/register { email,password,displayName }`
- 로그인: `POST /auth/login { email,password }` → `{ accessToken }`
- 프론트는 `localStorage.at`를 Authorization 헤더로 자동 첨부 (`app/frontend/lib/fetcher.ts`)

## 3) 제너레이터(필드 스키마)
```bash
# 프로젝트 루트에서 실행
pnpm gen:domain
# name, package, fields 입력
```
생성물:
- 백엔드: `app/backend/src/main/java/...` 경로에 Entity/Repo/Service/Controller + Flyway 마이그레이션 파일
- 프론트: `app/frontend/app/...` 경로에 목록/상세/신규 페이지 + `_schema.ts` + **AutoForm**(필드 기반 폼)

> `_schema.ts`는 기본 샘플만 생성됨. 필요한 필드를 수동 보강 후 AutoForm에 반영.

### 타입 지원
`string, long, int, boolean, instant, uuid, text`

## 4) 검색/정렬/페이징 규약
- 공통 파라미터: `q`(검색어), `page`(0-base), `size`(기본 20, 최대 200), `sort`(`field,dir;field2,dir2`)
- 백엔드: `Pageing.of(page,size,sort)` + `Specs.textLike(q, ...)`
- 샘플: `GET /api/messages/search?q=hello&page=0&size=10&sort=createdAt,desc`

## 5) OpenAPI SDK
```bash
# 백엔드 서버가 실행 중일 때 프로젝트 루트에서 실행
pnpm sdk:gen   # packages/sdk/src/index.ts 생성
pnpm sdk:build
```
- Next.js 앱에서 `@chatstack/sdk` 타입을 import하여 타입-안전 API 호출에 활용합니다.

## 6) 디자인 시스템 / Storybook
```bash
# 프로젝트 루트에서 실행
pnpm storybook   # @chatstack/ui 패키지의 Storybook 실행
```
- `Button`, `Table`, `Pagination`, `Input/Textarea/Checkbox/FormRow`, `AutoForm` 제공
- 컴포넌트 추가 시 **changesets**로 버전/CHANGELOG 관리

## 7) 품질/릴리즈
- ESLint/Prettier 기본 포함
- 릴리즈: `.github/workflows/release.yml` (변수/토큰 세팅 후 활성화)
  - `NPM_TOKEN` 저장 시 npm publish 자동화 가능

## 8) Docker/K8s
- `app/backend` 및 `app/frontend`에 각각 `Dockerfile` 포함
- k3s 템플릿: `deploy/k8s/`에 네임스페이스/디플로이/서비스/인그레스/시크릿 예시 포함

## 9) 운영 팁
- 외부 연동은 `@ConditionalOnProperty`로 기능 스위치
- 운영에서는 `lazy-initialization=false` 권장(콜드스타트 방지)
- Health/Actuator 공개 범위는 보안 정책에 맞춰 조정

---

## 자주 하는 커스터마이즈
- **폼 자동 생성 강화**: `_schema.ts`에 `label`, `options`, `required` 등 메타 확장 → AutoForm 확장
- **검색 필드 지정**: 각 도메인 컨트롤러에서 `Specs.textLike(q, "title","name",...)` 필드 지정
- **정렬 화이트리스트**: `Pageing.of`에서 허용 필드만 allow하도록 튜닝
