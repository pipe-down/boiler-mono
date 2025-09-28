# SDD Toolkit 설치 방법 (Chatstack Monorepo용)

## 1) 압축 해제
`AGENTS.md`, `specs/`, `tools/`, `.github/`를 **레포 루트**에 복사합니다.

## 2) Backend에 OpenAPI Generator 연결
`apps/backend/build.gradle.kts` 상단에 다음 한 줄을 추가:
```kts
apply(from = "$rootDir/tools/openapi/openapi.gradle.kts")
```

## 3) Frontend SDK 타입 생성 스크립트 추가(선택)
루트 `package.json`에 스크립트를 추가:
```json
{ "scripts": { "sdk:gen:spec": "openapi-typescript specs/openapi.yaml -o packages/sdk/src/index.ts" } }
```
> 기존 `sdk:gen`이 서버 런타임 스펙(`/v3/api-docs`)을 쓰는 경우, **스펙 주도**로 전환하려면 `sdk:gen:spec`을 사용하세요.

## 4) Spec Gate(PR 체크)
`.github/workflows/spec-gate.yml`를 워크플로로 추가하세요.

## 5) Codex CLI 프롬프트 예시
```
specs/openapi.yaml 기준으로 /messages 태그 구현.
생성된 인터페이스를 구현하고, 서비스/리포는 기존 패턴 유지.
AGENTS.md 가드레일 준수, 테스트 추가 후 ./gradlew test.
```

## 6) 유의사항
- 생성된 OpenAPI **스텁 직접 수정 금지**(재생성 시 덮어씀)
- Flyway DDL은 기존 파일 수정 금지. 새로운 마이그레이션으로 처리
