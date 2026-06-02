# 남경기노회 공식 웹사이트 (NKGC)

> 대한예수교 장로회 남경기노회의 공식 웹사이트입니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript 5 |
| Runtime | React 19 |
| Styling | Tailwind CSS 3.4 |
| Animation | Framer Motion 12 |
| Database ORM | Prisma 5.22 |
| Authentication | NextAuth 4 (JWT) |
| Rich Editor | Tiptap 3 / TinyMCE 8 |
| Image Processing | Sharp 0.34 |
| Password Hashing | bcrypt 6 |
| State Management | Zustand 5 |
| DB (Production) | Neon PostgreSQL (Vercel Marketplace) |
| DB (Local Dev) | SQLite |
| Deployment | Vercel |

---

## 주요 기능

### 공개 사이트

| 메뉴 | 경로 | 설명 |
|------|------|------|
| 홈 | `/` | 히어로 섹션, 공지, 갤러리, 관련기관 링크 |
| 노회소개 | `/about/*` | 노회 소개, 임원진, 시찰소개, 인사말 |
| 시찰소개 | `/about/inspections` | 시찰 목록 및 정보 |
| 기관소개 | `/organizations/*` | 남·여·청년·학생·주일학교 기관 |
| 노회행정 | `/administration/*` | 회원현황, 상비부, 별명부, 서식 |
| 노회자료 | `/resources/*` | 규정, 결의서, 사진, 공지 |
| 노회알림 | `/notices/*` | 공지, 자립위, 정회원 전용 게시판 |
| 게시판 | `/board/[type]/*` | 동적 게시판 (목록·상세·작성·수정) |
| 상회비 납부 | TopBar 버튼 | 계좌 안내 모달 (DB 관리) |

### 관리자 (Admin)

| 메뉴 | 경로 |
|------|------|
| 대시보드 | `/admin` |
| **노회소개** | 노회소개·임원·콘텐츠 관리 |
| **노회행정** | 회원관리·가입승인·상비부·상회비·상회비납부·별명부 |
| **노회자료** | 규칙·결의서·노회록·사진·영상·고시 관리 |
| **노회알림** | 게시판설정·팝업 관리 |
| **시찰소개** | 시찰 관리 |
| **기관소개** | 기관 관리 |
| **메인 페이지** | 히어로 섹션 관리 |
| **미디어 관리** | 통합 미디어 라이브러리 |
| **시스템 관리** | 데이터 관리·메뉴 관리 |

---

## 데이터베이스 모델 (18개)

```
User · Post · Comment · Like · Attachment
FeeStatus · FeePaymentAccount · StandingCommittee · SeparateRegistry
Resolution · Rule · Popup · HeroConfig · BoardSettings
Settings · ContentBlock · MediaFolder · FileAsset
```

---

## 디렉토리 구조

```
nkgc/
├── app/
│   ├── about/              # 노회소개 페이지
│   ├── admin/              # 관리자 페이지 (40+ 페이지)
│   ├── administration/     # 노회행정 공개 페이지
│   ├── api/                # API 라우트 (59개)
│   ├── board/              # 동적 게시판
│   ├── notices/            # 노회 알림
│   ├── organizations/      # 기관 소개
│   ├── resources/          # 노회 자료
│   ├── layout.tsx          # 루트 레이아웃
│   └── page.tsx            # 홈 페이지
├── components/
│   ├── admin/              # 관리자 UI 컴포넌트
│   ├── auth/               # 인증 컴포넌트
│   ├── board/              # 게시판 컴포넌트 (Tiptap 에디터)
│   ├── common/             # 공통 UI (모달, 헤더, 알림)
│   ├── layout/             # Header · Footer
│   ├── media/              # 미디어 관리 컴포넌트
│   └── sections/           # 홈 섹션 컴포넌트
├── lib/
│   ├── auth.ts             # NextAuth 설정
│   ├── prisma.ts           # Prisma 클라이언트
│   ├── board-config.ts     # 게시판 타입 설정
│   └── permission.ts       # 권한 관리
├── prisma/
│   ├── schema.prisma       # DB 스키마 (18 모델)
│   └── seed.js             # 초기 데이터 시드
├── scripts/
│   ├── import-to-postgres.mjs  # SQLite → PostgreSQL 이관
│   ├── archived/               # 일회성 마이그레이션 스크립트
│   └── check-*.ts / verify-*.ts / reset-*.ts
├── public/
│   ├── images/             # 이미지 에셋
│   ├── uploads/            # 업로드 파일 (로컬)
│   ├── resolutions/        # 결의서 PDF
│   └── md/                 # 프로젝트 문서
└── middleware.ts            # NextAuth 기반 라우트 보호
```

---

## 시작하기

### 환경변수 설정

`.env` 파일 생성:

```env
# 로컬 개발 (SQLite)
DATABASE_URL="file:./prisma/dev.db"
DIRECT_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-32chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 설치 및 실행

```bash
npm install

# DB 스키마 적용
npx prisma db push

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드 및 프로덕션

```bash
npm run build
npm start
```

---

## 배포 (Vercel)

### 환경변수 (Vercel Dashboard → Settings → Environment Variables)

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL Pooler URL |
| `DIRECT_URL` | Neon PostgreSQL Direct URL (migrate용) |
| `NEXTAUTH_SECRET` | 32자 이상 랜덤 문자열 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

### PostgreSQL 데이터 이관

```bash
# Neon DB URL을 .env에 설정 후
npx prisma migrate deploy
node scripts/import-to-postgres.mjs
```

---

## 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 프로덕션 (merge 승인 후만 반영) |
| `refactor/tech-debt-cleanup` | 현재 작업 브랜치 |

---

## 연락처

- **노회서기**: 문보길 목사 | 010-9777-1409
- **이메일**: naloveu@korea.com
- **전화**: 050-2247-5432

---

© 2025 대한예수교 장로회 남경기노회. All rights reserved.
