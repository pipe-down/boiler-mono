# Chatstack Frontend (완성판)
- `chatstack_prod.zip` 백엔드와 연동되는 **완성형 프론트**.
- **BFF 프록시**(`/api/bridge/*`)로 백엔드 호출 → CORS 이슈 회피.
- 로그인/회원가입/채팅/프레즌스/검색/파일 업로드 제공.

## 환경변수
- `SPRING_BASE_URL` (선택): 백엔드 URL. 기본값 `http://localhost:8080`

## 실행
```bash
# Node 18+
npm i    # 또는 pnpm i
npm run dev
# http://localhost:3000
```
