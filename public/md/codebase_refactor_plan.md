# NKGC 코드베이스 리팩토링 계획

> 작성일: 2026-06-01  
> 분석 기준: Next.js 15 + Prisma (SQLite) + next-auth + TiptapEditor 스택

---

## 분석 요약

| # | 문제 | 심각도 |
|---|------|--------|
| 1 | 기술 부채 (에디터 3종 공존, 인증 이중화, 컴포넌트 구조 혼재) | 높음 |
| 2 | 마이그레이션 스크립트 및 레거시 잔류물 | 중간 |
| 3 | 프로덕션 완성도 부족 (SQLite, 로컬 파일 스토리지, 시크릿 하드코딩) | 높음 |

---

## 1번 해결: 기술 부채 정리

### A. 에디터 통합 — Quill 제거

`PostWrite.tsx`와 `PostEdit.tsx` 모두 이미 **TiptapEditor**로 전환 완료.  
`QuillEditor.tsx`는 dead code 상태.

**실행 명령:**
```bash
# 파일 삭제
rm components/board/QuillEditor.tsx

# 불필요 패키지 제거
npm uninstall react-quill-new quill-better-table quill-markdown-shortcuts
```

> TinyMCE는 `app/admin/rules/page.tsx` 하나에서만 사용 중.  
> Tiptap 교체 시 비용 대비 효과 있음. 우선순위는 낮음.

---

### B. 인증 이중화 제거 ⚠️ (보안 우선)

**현재 구조 (문제):**

| 인증 방식 | 사용처 | 문제점 |
|-----------|--------|--------|
| `next-auth` | 일반 회원 로그인 | 정상 (Prisma DB + role 시스템) |
| `jose` 커스텀 JWT | 관리자 비밀번호 | `ADMIN_PASSWORD` 평문 비교, DB와 무관 |

**해결 방향**: `admin_token` 쿠키 인증 폐기 → next-auth의 `role === 'admin'` 체크로 통합

```ts
// middleware.ts 수정
import { getToken } from 'next-auth/jwt';

const token = await getToken({ req });
if (!token || token.role !== 'admin') {
  return NextResponse.redirect('/login');
}
```

**삭제 대상 파일:**
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/check/route.ts`
- `app/api/auth/refresh/route.ts`

---

### C. 컴포넌트 구조 정리

`/components/`를 canonical로 정하고, `app/components/`를 점진적으로 이동.

**이동 계획:**
```
app/components/admin/     → components/admin/
app/components/auth/      → components/auth/
app/components/common/    → components/common/
app/components/layout/    → components/layout/
app/components/sections/  → components/sections/
```

---

## 2번 해결: 레거시 잔류물 정리

### 즉시 삭제 가능한 파일

```bash
# .bak 파일 (git 히스토리에 보존됨)
rm app/organizations/student/page.tsx.bak
rm app/organizations/young-adult/page.tsx.bak
rm app/organizations/mens/page.tsx.bak
rm app/organizations/womens/page.tsx.bak

# 임시 파일
rm temp_grep.txt

# legacy DB (마이그레이션 완료 확인 후 삭제)
rm prisma/legacy.db
```

### scripts/ 폴더 구조 정리

28개 스크립트 중 일회성 마이그레이션 스크립트를 `archived/`로 격리.

```bash
mkdir scripts/archived

# 일회성 스크립트 격리
mv scripts/migrate-*.ts scripts/archived/
mv scripts/migrate-*.mjs scripts/archived/
mv scripts/import-*.js scripts/archived/
mv scripts/seed-*.ts scripts/archived/
mv scripts/seed-*.js scripts/archived/
```

**상시 유지 파일 (루트에 보존):**
- `reset-admin.ts` — 운영 유틸
- `check-rules.js` — 검증 유틸

---

## 3번 해결: 프로덕션 완성도 향상

### A. 환경변수 하드코딩 제거 (즉시 적용)

`app/api/auth/login/route.ts:6` 에 폴백 시크릿 노출:

```ts
// 현재 (위험)
process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
process.env.ADMIN_PASSWORD || 'admin1234'

// 변경: 폴백 없이 undefined이면 서버 시작 시 throw
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
if (!process.env.NEXTAUTH_SECRET) throw new Error('NEXTAUTH_SECRET is required');
```

`.env` 필수 항목:
```env
JWT_SECRET=<32자 이상 랜덤 문자열>
NEXTAUTH_SECRET=<32자 이상 랜덤 문자열>
DATABASE_URL=<DB 연결 문자열>
```

---

### B. SQLite → PostgreSQL 마이그레이션 (중기 과제)

현재 `dev.db` SQLite를 프로덕션에 사용 중 — 동시 쓰기에 취약.  
Prisma 스키마는 이미 PostgreSQL 전환에 적합하게 설계되어 있음.

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // sqlite → postgresql
  url      = env("DATABASE_URL")
}
```

**권장 스택:** Vercel + Supabase (무료 플랜) 또는 Vercel Postgres

**마이그레이션 절차:**
1. Supabase 프로젝트 생성 → `DATABASE_URL` 획득
2. `schema.prisma` provider 변경
3. `npx prisma migrate deploy`
4. `dev.db` 데이터 덤프 → PostgreSQL import

---

### C. 파일 스토리지 클라우드화 (장기 과제)

`FileAsset` 스키마에 이미 `provider: 'local' | 's3' | 'r2'` 필드 준비 완료.  
현재는 `local`만 사용 중.

**권장: Cloudflare R2** (무료 대역폭, S3 호환 API)

```ts
// app/api/upload/route.ts 수정 방향
// 현재: sharp 처리 후 /public/uploads/ 로컬 저장
// 변경: 처리 후 R2 PUT → CDN URL을 fileUrl로 저장
```

---

## 우선순위 로드맵

| 우선순위 | 작업 | 예상 소요 시간 |
|---------|------|--------------|
| 🔴 즉시 | .bak/temp 파일 삭제, 시크릿 폴백 제거 | 30분 |
| 🟠 단기 | QuillEditor 제거 + 패키지 정리, scripts/ 아카이브 | 2시간 |
| 🟡 중기 | 인증 단일화 (next-auth 통합, jose 제거) | 반나절 |
| 🟢 장기 | SQLite → PostgreSQL, 로컬 파일 → R2 | 1~2일 |
