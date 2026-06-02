# Vercel 배포 및 DB 전환 진단 보고서

작성일: 2026-06-02  
대상 프로젝트: `nkgc-presbytery` / Next.js 15 App Router / Prisma / 현재 SQLite

## 1. 결론

현재 코드베이스는 `npm run build` 기준으로 로컬 프로덕션 빌드는 성공한다. 따라서 "Next.js 코드가 빌드 자체를 못 하는 상태"는 아니다.

하지만 Vercel 최종 배포 관점에서는 그대로 올리면 안정 운영 가능성이 낮다. 핵심 원인은 하나가 아니라 세 가지가 묶여 있다.

1. Prisma datasource가 SQLite로 고정되어 있다.
2. 런타임 데이터와 업로드 파일을 로컬 파일시스템(`data`, `public/uploads`, `prisma/dev.db`)에 쓰고 있다.
3. 운영 백업/복원/CSV 관리 기능이 로컬 서버형 파일 배치를 전제로 설계되어 있다.

전환 가능성은 높다. 다만 "DB provider만 PostgreSQL로 바꾸는 작업"으로 끝내면 에러 없이 전환될 가능성은 낮고, DB + Blob/Object Storage + JSON 데이터 영속화까지 함께 정리해야 한다.

권장 목표 구조는 다음과 같다.

- DB: Vercel Marketplace의 Neon Postgres 또는 외부 PostgreSQL
- 파일 저장소: Vercel Blob 또는 S3/R2 계열 Object Storage
- 기존 `data/*.json`: 운영 중 수정되는 데이터는 DB 테이블로 이전
- 기존 `public/wp-content`, `public/uploads`, `public/resolution`, `public/pdf`: 정적 보존 파일과 신규 업로드 파일을 분리한 뒤 Blob/CDN URL로 관리

## 2. 현재 상태 요약

### 빌드 상태

확인 명령:

```bash
npm run build
```

결과:

- 빌드 성공
- 114개 App Router route 생성
- ESLint warning 다수 존재
- fatal type/build error는 현재 로컬 환경에서는 없음

주의할 점:

- 현재 빌드는 로컬 `.env`, `prisma/dev.db`, `data/*.json`, `public/*` 파일들이 존재하는 환경에서 성공한 것이다.
- Vercel 런타임의 지속 저장소 문제를 검증한 것은 아니다.

### 저장소 용량

확인 결과:

```text
public: 1.1G
public/wp-content: 765M
public/uploads: 191M
public/pdf: 91M
public/db_sql: 42M
public/resolution: 42M
```

파일 수 상위:

```text
jpg 403
pdf 227
hwp 147
png 87
zip 17
xlsx 7
```

큰 파일 예:

- `public/uploads/2025/12/*.pdf`
- `public/wp-content/uploads/.../*.hwp`
- `public/pdf/노회록/*.pdf`

이 상태는 Vercel 배포 용량, 빌드 시간, 함수 번들 추적, 정적 파일 캐싱 전략에 부담이 크다.

## 3. 정확한 문제점

### P0. SQLite는 Vercel 운영 DB로 부적합

근거:

- `prisma/schema.prisma:8-10`

```prisma
datasource db {
  provider  = "sqlite"
  url       = env("DATABASE_URL")
}
```

문제:

- SQLite 파일 DB는 로컬 디스크 파일(`prisma/dev.db`)에 의존한다.
- Vercel Functions는 배포된 파일을 읽을 수는 있지만, 운영 데이터베이스 파일을 안정적으로 갱신/공유/보존하는 구조가 아니다.
- 서버리스 인스턴스가 여러 개 뜨면 단일 SQLite 파일을 안전하게 공유할 수 없다.

해결:

- Prisma datasource를 PostgreSQL로 전환한다.
- `DATABASE_URL`은 Vercel 환경변수에서 주입한다.
- `prisma/migrations/migration_lock.toml`도 SQLite 기준이므로 PostgreSQL용 migration history를 새로 정리한다.

권장:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### P0. 런타임 파일 업로드가 `public/uploads`에 직접 쓰고 있음

근거:

- `app/api/upload/route.ts:24-44`
- `app/api/upload/video/route.ts`
- `app/api/admin/resolutions/route.ts`
- `lib/services/storage/LocalStorageProvider.ts:9-50`
- `app/api/media/upload/route.ts`

예:

```ts
const uploadDir = join(process.cwd(), 'public', 'uploads', String(year), month);
await mkdir(uploadDir, { recursive: true });
await writeFile(filePath, buffer);
const fileUrl = `/uploads/${year}/${month}/${fileName}`;
```

문제:

- Vercel에서 런타임에 쓴 파일은 배포 산출물의 영구 정적 파일이 되지 않는다.
- 새 배포, 함수 재시작, 다른 region/function instance에서 파일이 보이지 않을 수 있다.
- 업로드 성공 응답을 받아도 이후 다운로드/표시가 404가 될 수 있다.

공식 Vercel 문서 근거:

- Vercel은 파일 읽기에는 Node File Trace를 사용하지만, 파일 쓰기 영속화는 Vercel Blob 같은 object storage 사용을 권장한다.
- 참고: https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions
- Vercel Blob 문서: https://vercel.com/docs/vercel-blob

해결:

- `LocalStorageProvider`를 `BlobStorageProvider`로 교체한다.
- DB에는 `/uploads/...` 상대경로 대신 Blob public URL 또는 storage key를 저장한다.
- 삭제/복원/백업도 Blob API 기준으로 바꾼다.

### P0. 관리자 백업/복원이 로컬 파일 시스템과 SQLite 파일에 의존

근거:

- `app/api/admin/backup/route.ts:33-37`

```ts
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const dataPath = path.join(process.cwd(), 'data');
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
```

- `app/api/admin/restore/route.ts:53-80`

```ts
const dbDest = path.join(process.cwd(), 'prisma', 'dev.db');
await fs.copyFile(dbSource, dbDest);
await fs.rm(dataDest, { recursive: true, force: true });
await fs.rm(uploadsDest, { recursive: true, force: true });
```

문제:

- Vercel 운영 DB는 `prisma/dev.db` 파일이 아니다.
- `data`와 `public/uploads`를 런타임에 갈아끼우는 복원 방식은 Vercel 배포 모델과 맞지 않는다.
- ZIP 전체를 메모리에 모으는 방식은 파일 규모가 커지면 함수 메모리/실행시간 한계에 걸릴 수 있다.

해결:

- 운영 백업은 PostgreSQL dump 또는 Prisma 기반 export로 분리한다.
- 파일 백업은 Blob list/export 또는 원본 object storage lifecycle 정책으로 분리한다.
- 관리자 UI의 "전체 복원"은 운영에서는 비활성화하거나, 별도 maintenance script로 제한한다.

### P0. 운영 중 수정되는 JSON 데이터가 `data/*.json` 파일에 저장됨

근거:

- `app/api/greeting/route.ts`
- `app/api/introduction/route.ts`
- `app/api/officers/route.ts`
- `app/api/past-officers/route.ts`
- `app/api/inspections/route.ts`
- `app/api/organizations/route.ts`
- `app/api/contact-info/route.ts`
- `app/api/admin/csv/route.ts:515-661`

예:

```ts
const filePath = path.join(process.cwd(), 'data', 'officers.json');
await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
```

문제:

- 빌드 시 포함된 JSON은 읽을 수 있지만, 운영 중 수정 내용은 배포 파일로 영구 반영되지 않는다.
- 관리자에서 수정한 임원/시찰/기관/인사말/연락처 정보가 재배포 후 사라질 수 있다.

해결:

- `data/*.json` 중 운영 수정 대상은 DB 테이블로 이전한다.
- 단순 key-value 콘텐츠는 기존 `Settings` 테이블을 확장하거나 `ContentBlock` 테이블을 추가한다.
- 구조형 데이터는 별도 테이블로 정규화하거나 PostgreSQL `Json` 필드로 보관한다.

우선순위:

1. `contact-info.json`
2. `introduction.json`
3. `officers.json`
4. `past-officers.json`
5. `inspections.json`
6. `organizations.json`

### P1. Prisma Client 초기화가 빌드/런타임 환경에 민감함

근거:

- `lib/prisma.ts:5-9`

```ts
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
    });
```

문제:

- top-level에서 Prisma Client를 바로 만든다.
- 현재는 빌드 성공했지만, Vercel 첫 배포에서 `DATABASE_URL` 누락/불일치 시 모듈 평가 단계에서 바로 터질 수 있다.
- production에서도 `log: ['query']`가 켜져 있어 운영 로그가 과도해질 수 있다.

해결:

- `DATABASE_URL` 필수 검증을 명확히 하되, Prisma singleton은 Vercel build/runtime에 맞게 관리한다.
- 운영 query log는 끈다.
- PostgreSQL 연결 pool/connection limit을 DB 제공자 권장값에 맞춘다.

권장 형태:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### P1. SQLite → PostgreSQL import script는 초안 수준

근거:

- `scripts/import-to-postgres.mjs`

장점:

- 이미 SQLite export JSON을 PostgreSQL로 옮기려는 의도가 반영되어 있다.
- 주요 모델 17종을 순서대로 import한다.

문제:

- 현재 `schema.prisma`가 SQLite provider라 이 스크립트만으로 PostgreSQL import가 불가능하다.
- 명시적 `id`를 넣은 뒤 PostgreSQL sequence reset이 없다.
- foreign key 순서는 대체로 맞지만, 데이터 누락/중복/nullable 차이에 대한 검증이 부족하다.
- `upsert({ where: { id } })` 후 `update: {}`라 재실행 시 기존 row의 최신 값 반영이 안 된다.
- `Like`는 `@@unique([userId, postId])`가 있으므로 중복 데이터가 있으면 실패할 수 있다.
- 파일 URL은 여전히 로컬 `/uploads`, `/wp-content` 경로를 전제로 한다.

해결:

- PostgreSQL용 schema/migration 확정 후 `prisma generate`.
- import 전 `sqlite-export.json`에 대해 referential integrity 검증.
- import 후 PostgreSQL sequence reset.
- 파일 경로를 Blob URL 또는 storage key로 변환하는 media migration step 추가.

### P1. `public`에 운영 데이터와 과거 마이그레이션 자료가 과다 포함됨

문제 파일군:

- `public/wp-content` 765MB
- `public/uploads` 191MB
- `public/db_sql` 42MB
- `public/pdf` 91MB

문제:

- 배포 패키지가 무거워진다.
- 정적 자산으로 남겨야 할 파일과 운영 업로드 파일이 섞여 있다.
- DB dump가 `public` 아래 있으면 외부 공개 위험이 있다.

해결:

- `public/db_sql`은 즉시 비공개 위치로 이동하고 배포 제외한다.
- 과거 첨부 파일은 Blob에 업로드하고, DB `Attachment.fileUrl`을 Blob URL 또는 `/api/attachments/:id` 프록시로 통일한다.
- 정말 정적이어야 하는 로고/배경 소수만 `public`에 남긴다.

### P1. PostgreSQL 전환 시 Prisma schema 타입 개선 여지

현재는 SQLite 호환을 위해 많은 구조형 값이 `String`으로 저장된다.

예:

- `BoardSettings.categories String @default("[]")`
- `BoardSettings.settings String?`
- `StandingCommittee.members String`
- 날짜 성격 필드가 `String`: `SeparateRegistry.birthDate`, `registrationDate`, `cancellationDate`

전환 전략:

- 안정성을 우선하면 1차 전환에서는 타입을 크게 바꾸지 않는다.
- 2차 개선에서 PostgreSQL `Json`, `DateTime`, relation table로 정리한다.

권장:

- 1차: 기존 데이터 손실 없이 provider만 PostgreSQL 기준으로 옮김
- 2차: `Json`/정규화/인덱스 개선

## 4. 권장 목표 아키텍처

### DB

권장 1순위:

- Vercel Marketplace Neon Postgres

대안:

- Supabase Postgres
- Railway/Self-hosted Postgres
- AWS RDS/Aurora

필수 환경변수:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
BLOB_READ_WRITE_TOKEN=...
```

### 파일 저장소

권장:

- Vercel Blob

저장 방식:

```text
attachments/{postId}/{uuid}-{filename}
media/{yyyy}/{mm}/{uuid}-{filename}
resolutions/{tab}/{timestamp}-{filename}
legacy/wp-content/...
```

DB 필드:

- 기존 `fileUrl`, `path`에는 public URL을 저장하거나
- 더 안정적으로는 `storageKey`, `publicUrl`, `provider`, `mimeType`, `size`를 분리

1차 전환에서는 현재 schema를 크게 흔들지 않기 위해 `fileUrl/path`에 Blob URL을 저장하는 것이 가장 안전하다.

### JSON 데이터

선택지 A: `Settings` 확장

```text
key: contact_info
value: JSON string
```

장점:

- 빠르게 전환 가능
- schema 변경 작음

단점:

- 타입 안전성 낮음
- 쿼리/검색이 어려움

선택지 B: `ContentBlock` 모델 추가

```prisma
model ContentBlock {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

장점:

- PostgreSQL에 적합
- 운영 중 수정 데이터 관리가 명확해짐

권장:

- 1차는 `ContentBlock` 또는 `Settings` 중 하나로 통일
- 구조가 복잡한 `inspections`, `organizations`는 일단 `Json`으로 보관 후 필요 시 정규화

## 5. 단계별 전환 계획

### Phase 0. 배포 전 동결 및 백업

목표:

- 현재 운영/개발 데이터를 동결하고 원본을 보존한다.

작업:

1. 현재 SQLite DB 백업
2. `data` 디렉토리 백업
3. `public/uploads`, `public/wp-content`, `public/resolution`, `public/pdf` 파일 목록과 checksum 생성
4. `public/db_sql`을 공개 배포 대상에서 제외

검증:

```bash
npm run build
npx prisma validate
```

### Phase 1. PostgreSQL schema 전환

작업:

1. `prisma/schema.prisma` provider를 `postgresql`로 변경
2. PostgreSQL용 migration 생성
3. `package.json`에 Vercel 빌드용 Prisma generate 보장

권장 script:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

주의:

- migration history는 SQLite와 PostgreSQL이 다르므로 새 migration baseline을 잡는 편이 안전하다.
- 기존 SQLite migration을 그대로 PostgreSQL에 적용하려고 하면 provider mismatch가 날 가능성이 높다.

### Phase 2. 데이터 import 검증

작업:

1. SQLite에서 JSON export 생성
2. PostgreSQL staging DB에 import
3. row count 비교
4. foreign key 검증
5. sequence reset

검증 SQL 예:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;
SELECT COUNT(*) FROM attachments;
SELECT COUNT(*) FROM file_assets;
```

sequence reset 예:

```sql
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE(MAX(id), 1)) FROM posts;
SELECT setval(pg_get_serial_sequence('attachments', 'id'), COALESCE(MAX(id), 1)) FROM attachments;
```

### Phase 3. 파일 저장소 전환

작업:

1. `@vercel/blob` 도입
2. `LocalStorageProvider`와 동일 interface의 `BlobStorageProvider` 작성
3. 신규 업로드 API를 Blob 저장으로 변경
4. 기존 파일을 Blob에 일괄 업로드
5. DB의 `Attachment.fileUrl`, `Resolution.fileUrl`, `FileAsset.path`, `HeroConfig.backgroundImage` 등을 새 URL로 치환

주의:

- 기존 `/wp-content/uploads/...`와 `/uploads/...` URL을 한 번에 깨뜨리면 게시글 첨부가 대량 404가 된다.
- 1차 배포에서는 `/api/attachments/:id`가 old path와 new URL을 모두 처리하도록 호환 계층을 두는 것이 안전하다.

### Phase 4. JSON 데이터 영속화

작업:

1. `data/contact-info.json`, `officers.json`, `past-officers.json`, `inspections.json`, `organizations.json`를 DB로 import
2. public page의 `fs.readFile`을 DB fetch로 변경
3. admin API의 `fs.writeFile`을 DB update로 변경
4. CSV import/export도 DB 기준으로 통일

우선순위:

- 연락처/인사말/소개: 단순 content block
- 임원/역대임원: Json 또는 테이블
- 시찰/기관: Json 우선, 추후 정규화

### Phase 5. Vercel 환경 구성

필수:

```env
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...
BLOB_READ_WRITE_TOKEN=...
```

권장:

- Preview와 Production DB 분리
- Production 배포 전 staging DB에서 import rehearsal
- `vercel pull`로 env 동기화 후 로컬 `vercel build` 확인

### Phase 6. 최종 검증

검증 시나리오:

1. 홈 화면 공지/갤러리/히어로 표시
2. 로그인
3. 관리자 접근
4. 게시글 작성/수정/삭제
5. 파일 첨부 업로드/다운로드
6. 결의서 업로드/수정/삭제
7. 미디어 업로드
8. 회원 승인/거절
9. CSV import/export
10. 재배포 후 업로드 파일 유지 확인

## 6. 예상 에러와 예방책

| 위험 | 발생 지점 | 예방책 |
| --- | --- | --- |
| `provider = sqlite`로 Vercel DB 연결 실패 | Prisma | PostgreSQL provider 전환 및 새 migration |
| `DATABASE_URL` 누락 빌드 실패 | Vercel build | env 등록, `vercel pull`, build rehearsal |
| 업로드 후 404 | `public/uploads` 쓰기 | Blob 전환 |
| 관리자 JSON 수정 유실 | `data/*.json` write | DB/ContentBlock 전환 |
| PostgreSQL sequence 충돌 | explicit id import | import 후 `setval` 실행 |
| 대량 파일 배포 지연 | `public` 1.1GB | Blob 이전 및 배포 제외 |
| 기존 첨부 링크 깨짐 | `/wp-content`, `/uploads` | URL migration + 호환 프록시 |
| 백업/복원 API 실패 | `prisma/dev.db`, local zip | 운영용 backup/export로 재설계 |
| query log 과다 | `lib/prisma.ts` | production log 축소 |

## 7. 우선 수정 파일 목록

DB 전환:

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `package.json`
- `lib/prisma.ts`
- `scripts/import-to-postgres.mjs`

파일 저장소 전환:

- `lib/services/storage/StorageInterface.ts`
- `lib/services/storage/LocalStorageProvider.ts`
- 신규 `lib/services/storage/BlobStorageProvider.ts`
- `app/api/upload/route.ts`
- `app/api/upload/video/route.ts`
- `app/api/media/upload/route.ts`
- `app/api/admin/resolutions/route.ts`
- `app/api/attachments/[id]/route.ts`
- `app/actions/media.ts`
- `app/actions/folders.ts`

JSON 데이터 전환:

- `app/api/greeting/route.ts`
- `app/api/introduction/route.ts`
- `app/api/contact-info/route.ts`
- `app/api/officers/route.ts`
- `app/api/past-officers/route.ts`
- `app/api/inspections/route.ts`
- `app/api/organizations/route.ts`
- `app/api/admin/csv/route.ts`
- 관련 public pages: `app/about/*`, `app/organizations/*`, `components/layout/Footer.tsx`

운영 백업/복원 재설계:

- `app/api/admin/backup/route.ts`
- `app/api/admin/restore/route.ts`
- `app/admin/data-management/page.tsx`

## 8. 최종 판단

에러 없이 전환할 수 있는 가능성은 있다. 다만 조건이 있다.

낮은 위험으로 전환하려면:

1. DB 전환과 파일 저장소 전환을 분리하지 말고 같은 릴리즈 범위에서 설계한다.
2. 기존 SQLite 데이터를 staging PostgreSQL에 먼저 import하고 검증한다.
3. 기존 첨부/미디어 파일을 Blob으로 옮긴 뒤 URL 호환 계층을 둔다.
4. `data/*.json` write API를 DB write로 바꾼다.
5. production 배포 전에 Vercel Preview에서 실제 업로드/재배포 유지 테스트를 한다.

현재 상태에서 바로 Vercel에 연결하면 "빌드는 될 수 있지만 운영 기능 일부가 깨지는" 쪽에 가깝다.  
정리 후 전환하면 성공 가능성은 높고, 가장 큰 작업량은 DB schema 자체보다 파일/JSON 영속화와 기존 링크 보존이다.

