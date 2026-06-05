# PWA 구현 계획서 — 남경기노회 웹사이트

> 작성일: 2026-06-05  
> 대상 프레임워크: Next.js 15 (App Router)  
> 배포 환경: Vercel

---

## 1. 목표

교인 및 관리자가 모바일 홈 화면에 앱을 설치하고, 오프라인에서도 주요 콘텐츠를 열람할 수 있도록 PWA(Progressive Web App)를 구현한다.

---

## 2. 구현 범위

| 기능 | 포함 여부 | 비고 |
|---|---|---|
| 홈 화면 설치 (Add to Home Screen) | ✅ | Web App Manifest |
| 오프라인 캐싱 (공지사항·게시판 목록) | ✅ | Service Worker |
| 푸시 알림 | ❌ | 추후 검토 |
| 백그라운드 동기화 | ❌ | 추후 검토 |
| 관리자 페이지 캐싱 | ❌ | 보안상 제외 |

---

## 3. 기술 스택

```
next-pwa  v5.x   (next.config.js 래퍼, Workbox 기반)
```

- `next-pwa`는 `next.config.js`에 플러그인으로 감싸는 방식으로 동작
- Workbox 전략: `StaleWhileRevalidate` (공개 페이지), `NetworkFirst` (API), `CacheFirst` (정적 자산)
- Vercel 환경에서 추가 설정 없이 바로 동작

---

## 4. 구현 단계

### Phase 1 — 패키지 설치 및 설정 (1~2시간)

```bash
npm install next-pwa
npm install --save-dev @types/next-pwa
```

**next.config.js 수정**

```js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'nkgc-api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
})

module.exports = withPWA({
  // 기존 nextConfig 내용 유지
  images: { ... },
  reactStrictMode: true,
  webpack: (config) => { ... },
})
```

---

### Phase 2 — Web App Manifest 생성 (30분)

`public/manifest.json` 신규 생성

```json
{
  "name": "대한예수교 장로회 남경기노회",
  "short_name": "남경기노회",
  "description": "남경기노회 공식 웹사이트",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a3a5c",
  "lang": "ko",
  "icons": [
    { "src": "/images/nkgc_logo.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/images/nkgc_logo.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

> **아이콘 주의**: PWA 규격상 192×192 및 512×512 PNG가 필수. 현재 `nkgc_logo.png`를 그대로 사용하되, 필요 시 별도 리사이즈 작업 필요.

---

### Phase 3 — layout.tsx 메타데이터 연결 (30분)

`app/layout.tsx`의 `metadata` 객체에 manifest 및 PWA 관련 메타 추가

```ts
export const metadata: Metadata = {
  // 기존 필드 유지...
  manifest: '/manifest.json',
  themeColor: '#1a3a5c',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '남경기노회',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}
```

---

### Phase 4 — 캐싱 전략 세부 조정 (1시간)

| URL 패턴 | 전략 | 이유 |
|---|---|---|
| `/` `/about/**` `/notices/**` `/boards/**` | StaleWhileRevalidate | 공개 콘텐츠, 빠른 로딩 우선 |
| `/api/**` | NetworkFirst | 최신 데이터 우선 |
| `/_next/static/**` | CacheFirst | 빌드 해시 포함, 변경 없음 |
| `/admin/**` | NetworkOnly | 캐싱 금지 (보안) |
| `/login` | NetworkOnly | 캐싱 금지 |

---

### Phase 5 — 오프라인 Fallback 페이지 (30분)

`public/offline.html` 생성 — 네트워크 없을 때 표시할 최소 안내 페이지

```html
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>오프라인 — 남경기노회</title></head>
<body>
  <h1>인터넷 연결을 확인해 주세요</h1>
  <p>남경기노회 웹사이트에 접속하려면 네트워크가 필요합니다.</p>
</body>
</html>
```

---

## 5. 파일 변경 목록

```
next.config.js          수정  — next-pwa 플러그인 래핑
app/layout.tsx          수정  — manifest, themeColor 메타 추가
public/manifest.json    신규  — Web App Manifest
public/offline.html     신규  — 오프라인 Fallback
public/sw.js            자동  — next-pwa 빌드 시 자동 생성
public/workbox-*.js     자동  — next-pwa 빌드 시 자동 생성
```

---

## 6. 아이콘 작업 (별도 확인 필요)

현재 프로젝트에 로고 파일 다수 존재 (`nkgc_logo.png`, `nkgc_logo_01.png` 등).  
PWA 설치 아이콘으로 사용할 **정사각형 PNG 2종 (192px, 512px)** 준비 필요.

- 기존 로고 파일 재사용 가능 여부 확인
- 필요 시 sharp를 활용한 리사이즈 스크립트 추가 (`scripts/generate-icons.ts`)

---

## 7. 테스트 계획

| 항목 | 방법 |
|---|---|
| Manifest 유효성 | Chrome DevTools → Application 탭 |
| Service Worker 등록 | DevTools → Application → Service Workers |
| 오프라인 동작 | DevTools → Network → Offline 모드 전환 후 주요 페이지 진입 |
| 설치 프롬프트 | Android Chrome에서 "홈 화면에 추가" 동작 확인 |
| Lighthouse PWA 점수 | 목표: 90점 이상 |

---

## 8. 예상 작업 시간

| Phase | 시간 |
|---|---|
| Phase 1 — 패키지 설치 및 next.config.js | 1~2h |
| Phase 2 — manifest.json | 0.5h |
| Phase 3 — layout.tsx 메타 | 0.5h |
| Phase 4 — 캐싱 전략 조정 | 1h |
| Phase 5 — 오프라인 Fallback | 0.5h |
| 아이콘 준비 + 테스트 | 1h |
| **합계** | **4.5~5.5h** |

---

## 9. 주의사항

- `next-pwa`는 `development` 환경에서 비활성화 권장 (`disable: process.env.NODE_ENV === 'development'`)
- Vercel 배포 시 `sw.js`, `workbox-*.js`가 `public/`에 자동 생성되므로 `.gitignore`에 추가 검토
- `next-auth` 세션 관련 API는 반드시 `NetworkOnly` 전략 적용
- Prisma/DB 연동 API는 캐싱하지 않음

---

## 10. OK 이후 진행 순서

1. 아이콘 파일 준비 여부 확인 (기존 로고 재사용 or 신규 생성)
2. Phase 1부터 순차 구현
3. 로컬 `npm run build` 후 Lighthouse 점수 확인
4. Vercel 배포 후 실제 모바일 설치 테스트
