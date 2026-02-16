# share2dm × Clozet 연결 기획서

> **Version**: 0.1
> **Date**: 2026-02-16
> **Status**: 기획 단계

---

## 1. 개요

### 1.1 연결의 목적

share2dm은 Instagram 릴스 공유를 트리거로 자동 DM을 발송하는 플랫폼이다.
Clozet은 릴스에 제품 스티커를 태그하고, 소비자가 릴스를 보며 바로 구매할 수 있는 플랫폼이다.

두 플랫폼을 연결하면:

```
[소비자가 릴스를 브랜드 DM으로 공유]    ← share2dm이 감지
              ↓
[자동 DM 발송: "이 릴스의 제품을 보러 가세요"]
              ↓
[링크 클릭 → app.clozet.my/reel/{short_code}]    ← Clozet으로 이동
              ↓
[릴스 시청 → 스티커 탭 → 제품 구매]    ← Clozet에서 전환
```

**핵심 가치**:
- share2dm: DM 자동화로 릴스 공유자를 놓치지 않음
- Clozet: share2dm이 생성한 트래픽이 Clozet 릴스 페이지로 유입됨
- 브랜드: 별도 랜딩페이지 없이, 릴스 공유 → DM → Clozet 구매까지 자동화

---

## 2. 현황 분석

### 2.1 share2dm 현재 캠페인 구조

```
share2dm_campaigns
  ├── ig_contents_id    (Instagram reel media_id — 웹훅 매칭 키)
  ├── short_code        (릴스 URL의 shortCode)
  ├── reel_url          (원본 Instagram URL)
  ├── response_message  (DM 문구)
  └── product_url       (DM에 포함될 링크 — 지금은 자사몰 URL)
```

현재 `product_url`은 브랜드가 직접 입력하는 일반 URL이다.
Clozet 연결 시 이 `product_url`이 **`app.clozet.my/reel/{short_code}`** 가 되도록 한다.

### 2.2 Clozet 현재 콘텐츠 구조

```
Clozet contents 테이블
  ├── short_code        (웹앱 URL의 식별자)
  ├── reel_video_id     (Instagram reel video ID)
  ├── ig_contents_code  (Instagram shortCode)
  └── 제품 태그 (content_product_tags)
```

`reel_video_id` 또는 `ig_contents_code`가 share2dm의 `ig_contents_id`와 같은 식별자다.
두 시스템이 **같은 릴스를 식별하는 공통 키**를 이미 가지고 있다.

---

## 3. 연결 방식 설계

### 3.1 핵심 원칙

> **같은 릴스 = 같은 media_id.**
> Clozet B.O에 등록된 릴스와 share2dm 캠페인은 `instagram reel media_id`로 1:1 매칭된다.

- share2dm이 Clozet에게 "이 media_id의 short_code가 뭐야?" 를 물어보는 방식
- 또는 Clozet B.O에서 콘텐츠 등록 시 share2dm에 자동 통보하는 방식

### 3.2 연결 흐름 (To-Be)

```
[share2dm Dashboard — Clozet 연결 후]

1. 캠페인 생성 시 릴스 URL 입력
         ↓
2. 기존: oEmbed로 media_id 추출
         ↓
3. 추가: Clozet API에 media_id로 조회
   → Clozet에 등록된 콘텐츠라면: short_code 반환
   → 없다면: 일반 URL 입력 모드 유지
         ↓
4. product_url = https://app.clozet.my/reel/{short_code}  (자동 입력)
         ↓
5. DM 발송 시 이 URL이 소비자에게 전달됨
```

---

## 4. 인증 방식 — Clozet 계정 연결

### 4.1 고민 정리

| 방식 | 장점 | 단점 | 결론 |
|------|------|------|------|
| **OAuth 2.0** | 업계 표준, 보안 강함, 권한 범위 제어 | Clozet 측 OAuth 서버 구현 필요 | Phase 2 |
| **API Key** | 구현 간단, 즉시 가능 | 키 분실 시 무효화 처리 필요 | **Phase 1 채택** |
| **Supabase JWT 공유** | 동일 Supabase 프로젝트라면 편리 | 보안 분리 불명확, 권장 안 함 | 미채택 |

### 4.2 Phase 1: API Key 방식 (즉시 구현 가능)

**Clozet B.O 측 작업**:
```
Clozet B.O 브랜드 설정 페이지
  ↓
"share2dm 연동" 섹션에서 API Key 발급
  → Key 형식: clz_{brand_id}_{random_32chars}
  → d2c_brands 테이블에 share2dm_api_key 컬럼 추가
  → 또는 신규 테이블 brand_api_keys 생성
```

**share2dm 측 작업**:
1. Dashboard에 "Clozet 연결" 버튼 추가
2. 클릭 시 모달: "Clozet B.O에서 발급한 API Key를 입력하세요"
3. 입력된 키로 Clozet API 인증 테스트
4. 성공 시 `share2dm_brands`에 `clozet_brand_id` + `clozet_api_key` 저장

```
[share2dm Dashboard]
  ┌─────────────────────────────────────────────────────────┐
  │  연결된 플랫폼                                           │
  │                                                          │
  │  ✅ Instagram  @brand_account                            │
  │                                                          │
  │  [ Clozet 연결하기 ]  ← 버튼                            │
  │                                                          │
  │  ─────────────────────────────────────────               │
  │  연결 후:                                                │
  │  ✅ Clozet    brand_slug   [연결 해제]                   │
  └─────────────────────────────────────────────────────────┘
```

**API Key 검증 엔드포인트 (Clozet 측에 새로 만들어야 함)**:
```
POST https://api.clozet.my/v1/auth/verify-key
Authorization: Bearer {api_key}

Response 200:
{
  "brand_id": "uuid",
  "brand_name": "브랜드명",
  "brand_slug": "brand-slug",
  "plan_type": "growth"
}
```

### 4.3 Phase 2: OAuth 2.0 방식 (정식 연동)

추후 Clozet에 OAuth 서버가 준비되면, API Key를 OAuth Access Token으로 교체한다.

```
[share2dm Dashboard] → "Clozet으로 계속하기" 클릭
       ↓
https://app.clozet.my/oauth/authorize
  ?client_id={share2dm_client_id}
  &redirect_uri=https://share2dm.xyz/auth/clozet/callback
  &scope=content:read,brand:read
  &state={random}
       ↓
[Clozet 로그인 페이지] → 브랜드 담당자 로그인
       ↓
[권한 동의: "share2dm이 콘텐츠 목록을 조회합니다"]
       ↓
Redirect → https://share2dm.xyz/auth/clozet/callback?code=ABC&state={...}
       ↓
[share2dm Worker: code → access_token 교환]
       ↓
share2dm_brands 에 clozet_access_token 저장
```

---

## 5. 데이터 모델 변경

### 5.1 share2dm 측 — `share2dm_brands` 테이블 수정

```sql
ALTER TABLE share2dm_brands
  ADD COLUMN clozet_brand_id TEXT,           -- Clozet의 brand UUID 또는 slug
  ADD COLUMN clozet_api_key TEXT,            -- 암호화 저장 필수
  ADD COLUMN clozet_connected_at TIMESTAMPTZ,
  ADD COLUMN clozet_brand_name TEXT;
```

### 5.2 share2dm 측 — `share2dm_campaigns` 테이블 수정

```sql
ALTER TABLE share2dm_campaigns
  ADD COLUMN clozet_content_id TEXT,         -- Clozet contents.id (UUID)
  ADD COLUMN clozet_short_code TEXT,         -- Clozet contents.short_code
  ADD COLUMN product_url_source TEXT         -- 'manual' | 'clozet' (어디서 왔는지 추적)
    DEFAULT 'manual';
```

### 5.3 Clozet 측 — `d2c_brands` 또는 신규 테이블 (선택)

```sql
-- Clozet B.O에서 API Key 관리용 (추가 필요)
ALTER TABLE d2c_brands
  ADD COLUMN share2dm_api_key TEXT,          -- 브랜드가 share2dm에 입력할 키
  ADD COLUMN share2dm_api_key_created_at TIMESTAMPTZ,
  ADD COLUMN share2dm_linked BOOLEAN DEFAULT false;
```

---

## 6. API 설계 — share2dm ↔ Clozet

### 6.1 share2dm → Clozet: 콘텐츠 조회

share2dm 캠페인 생성 시, Instagram media_id로 Clozet 콘텐츠를 조회한다.

```
GET https://api.clozet.my/v1/contents/by-media-id?media_id={ig_media_id}
Authorization: Bearer {clozet_api_key}

Response 200 (매칭 있음):
{
  "content_id": "uuid",
  "short_code": "Bx7kQ2m",
  "reel_url": "https://app.clozet.my/reel/Bx7kQ2m",
  "thumbnail_url": "https://...",
  "product_count": 3,
  "products": [
    { "product_id": "uuid", "name": "브랜드X 자켓", "price": 89000, "is_d2c": true }
  ]
}

Response 404 (Clozet에 등록 안 됨):
{
  "error": "content_not_found",
  "message": "이 릴스는 Clozet에 등록되지 않았습니다."
}
```

**share2dm Worker에서의 처리** (`/oembed` 엔드포인트 확장 또는 신규 `/clozet/lookup`):

```typescript
// workers/src/clozet.ts (신규)
export async function lookupClozetContent(
  mediaId: string,
  clozetApiKey: string
): Promise<ClozetContent | null> {
  const resp = await fetch(
    `https://api.clozet.my/v1/contents/by-media-id?media_id=${mediaId}`,
    { headers: { Authorization: `Bearer ${clozetApiKey}` } }
  );
  if (!resp.ok) return null;
  return resp.json();
}
```

### 6.2 Clozet → share2dm: 콘텐츠 등록 웹훅 (유기적 연결)

Clozet B.O에서 새 콘텐츠가 등록될 때, share2dm에 자동으로 알려준다.
→ 브랜드가 share2dm 대시보드에서 캠페인을 별도로 만들 필요 없어짐.

```
POST https://share2dm.xyz/webhook/clozet
X-Clozet-Signature: sha256={hmac}
Content-Type: application/json

{
  "event": "content.published",
  "brand_id": "clozet-brand-uuid",
  "content": {
    "content_id": "uuid",
    "ig_media_id": "1234567890",
    "ig_short_code": "Bx7kQ2m",
    "short_code": "Bx7kQ2m",
    "reel_url": "https://app.clozet.my/reel/Bx7kQ2m",
    "thumbnail_url": "https://...",
    "products": [...]
  }
}
```

**share2dm Worker 처리 로직**:
```
웹훅 수신
  ↓
1. HMAC 서명 검증 (clozet_webhook_secret 사용)
  ↓
2. brand_id로 share2dm_brands에서 연결된 브랜드 조회
  ↓
3. 해당 브랜드에 이미 같은 ig_media_id 캠페인이 있는지 확인
  ↓
4. 없으면 자동 생성:
   - ig_contents_id = ig_media_id
   - short_code = ig_short_code
   - product_url = https://app.clozet.my/reel/{short_code}
   - response_message = 브랜드 기본 DM 문구 (브랜드에서 설정)
   - clozet_content_id = content_id
   - clozet_short_code = short_code
   - product_url_source = 'clozet'
   - is_active = true
  ↓
5. 자동 생성 성공 로그 기록
```

---

## 7. Dashboard UI 변경

### 7.1 Clozet 연결 버튼

**위치**: Dashboard 상단 브랜드 정보 카드 영역

```
현재:
┌─────────────────────────────────────────────────────────────┐
│  안녕하세요, {brand_name} 👋                                 │
│  Plan: Growth  |  이번 달 DM: 1,240 / 50,000               │
└─────────────────────────────────────────────────────────────┘

변경 후:
┌─────────────────────────────────────────────────────────────┐
│  안녕하세요, {brand_name} 👋                                 │
│  Plan: Growth  |  이번 달 DM: 1,240 / 50,000               │
│                                                              │
│  연결된 플랫폼:                                              │
│  ✅ Instagram  @{brand_ig_account}                          │
│  [ 🔗 Clozet 연결하기 ]  ← 미연결 시                        │
│  ✅ Clozet  {brand_slug}  [설정]  ← 연결 후                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 캠페인 생성 모달 변경

**Clozet 미연결 시 (현재와 동일)**:
```
┌──────────────────────────────────────────────┐
│ 새 캠페인 만들기                               │
│                                               │
│ 릴스 URL *                                    │
│ [https://instagram.com/reel/...           ]   │
│                                               │
│ 제품 링크 *                                    │
│ [https://your-store.com/product           ]   │
│                                               │
│ DM 문구 *                                     │
│ [안녕하세요! 이 제품이 궁금하시다면...        ]   │
└──────────────────────────────────────────────┘
```

**Clozet 연결 후**:
```
┌──────────────────────────────────────────────┐
│ 새 캠페인 만들기                               │
│                                               │
│ 릴스 URL *                                    │
│ [https://instagram.com/reel/...           ]   │
│                  ↓ 자동 조회                   │
│ ✅ Clozet에서 발견됨!                          │
│    [릴스 썸네일]  제품 3개  Bx7kQ2m           │
│                                               │
│ 제품 링크  (자동 입력됨 — Clozet 연동)         │
│ [https://app.clozet.my/reel/Bx7kQ2m  🔒]     │
│                                               │
│ DM 문구 *                                     │
│ [이 릴스의 제품이 궁금하신가요? 👇          ]   │
└──────────────────────────────────────────────┘

또는:

│ ❌ Clozet에 등록되지 않은 릴스입니다.           │
│    제품 링크를 직접 입력해주세요.               │
│ [https://your-store.com/product           ]   │
```

### 7.3 캠페인 목록에서의 표시

```
┌──────────────────────────────────────────────────────┐
│ 캠페인명           │ 상태 │ DM  │ 클릭 │ 플랫폼       │
├──────────────────────────────────────────────────────┤
│ 봄 신상 자켓 릴스  │  ●   │ 312 │  89  │ 🔗 Clozet   │
│ 여름 슈즈 릴스     │  ●   │ 156 │  41  │ 🔗 Clozet   │
│ 이벤트 릴스        │  ●   │  45 │  12  │ 직접 입력   │
└──────────────────────────────────────────────────────┘
```

---

## 8. 유기적 연결 — 자동 캠페인 생성

### 8.1 시나리오: 브랜드가 Clozet B.O에서 콘텐츠 등록

```
[브랜드 담당자 — Clozet B.O]
  Instagram URL 입력 → 콘텐츠 등록 완료
       ↓
[Clozet 서버]
  → 등록된 브랜드 중 share2dm 연결 여부 확인
  → share2dm 연결됨 → Webhook 발송
       ↓
[share2dm Worker: POST /webhook/clozet 수신]
  → HMAC 검증
  → 브랜드 조회
  → 중복 캠페인 확인
  → 자동 캠페인 생성
       ↓
[브랜드 담당자 — share2dm Dashboard]
  다음 날 접속 시: 새 캠페인이 자동 생성되어 있음
  → 필요 시 DM 문구만 수정하면 됨
```

### 8.2 자동 캠페인 생성 시 기본값 처리

```
DM 문구 기본값 우선순위:
  1. 브랜드가 share2dm에서 설정한 기본 DM 템플릿 (있으면)
  2. 글로벌 기본값: "안녕하세요! 공유해주신 릴스의 제품 링크를 보내드려요 👇"

Clozet 연동 캠페인 DM 예시:
  "이 릴스에 등장한 제품이 궁금하신가요?
   Clozet에서 바로 확인하고 구매하실 수 있어요! 👇
   → {tracking_url}"

  클릭 시 → https://app.clozet.my/reel/{short_code}  (Clozet 릴스 페이지)
```

---

## 9. 보안 고려 사항

### 9.1 API Key 보안

| 항목 | 처리 방법 |
|------|----------|
| share2dm 저장 | 환경변수 기반 암호화 (AES-256) 후 DB 저장 |
| Clozet 저장 | Supabase 암호화 컬럼 또는 Vault |
| 전송 | HTTPS만 허용, 로그에 마스킹 |
| 만료/갱신 | 180일 유효 + 수동 재발급 |
| 권한 범위 | 읽기 전용 (콘텐츠 조회만 가능) |

### 9.2 Clozet → share2dm Webhook 보안

```
HMAC-SHA256 서명 검증:
  X-Clozet-Signature: sha256={hmac(secret, body)}
  → share2dm_brands.clozet_webhook_secret으로 검증
  → 불일치 시 401 반환, 로그 기록
```

### 9.3 URL 조작 방지

- `product_url_source = 'clozet'`인 캠페인은 URL 수동 수정 불가 (프론트엔드 잠금)
- Clozet short_code 외의 `app.clozet.my` URL 직접 입력은 허용하되 경고 표시

---

## 10. 구현 단계

### Phase 1 — 수동 연결 (2주)

**목표**: 브랜드가 Clozet API Key를 입력하면, 캠페인 생성 시 자동으로 Clozet 릴스 URL 추천

| 주차 | 작업 | 담당 |
|------|------|------|
| 1주 | **share2dm DB**: `share2dm_brands`에 `clozet_*` 컬럼 추가 | share2dm |
| 1주 | **Clozet B.O**: `d2c_brands`에 `share2dm_api_key` 컬럼 추가, 발급 UI | Clozet |
| 1주 | **Clozet API**: `GET /v1/contents/by-media-id` 엔드포인트 신규 개발 | Clozet |
| 1주 | **share2dm Worker**: `/clozet/verify` (API Key 검증) 엔드포인트 추가 | share2dm |
| 2주 | **share2dm Dashboard**: "Clozet 연결" 버튼 + 모달 UI 개발 | share2dm |
| 2주 | **share2dm Dashboard**: 캠페인 생성 시 Clozet 조회 + product_url 자동 입력 UI | share2dm |
| 2주 | **E2E 테스트**: 릴스 URL 입력 → Clozet 조회 → URL 자동 입력 → DM 발송 검증 | 공통 |

### Phase 2 — 자동 동기화 (2주)

**목표**: Clozet B.O에서 콘텐츠 등록 시 share2dm 캠페인 자동 생성

| 주차 | 작업 | 담당 |
|------|------|------|
| 3주 | **share2dm Worker**: `POST /webhook/clozet` 수신 처리 + HMAC 검증 | share2dm |
| 3주 | **share2dm DB**: 자동 생성 캠페인 구분 컬럼, 기본 DM 템플릿 설정 | share2dm |
| 3주 | **Clozet B.O**: 콘텐츠 등록 시 share2dm Webhook 발송 로직 추가 | Clozet |
| 4주 | **share2dm Dashboard**: 자동 생성 캠페인 표시, DM 문구 수정 UI | share2dm |
| 4주 | **E2E 테스트**: Clozet B.O 등록 → share2dm 자동 캠페인 생성 → DM 발송 | 공통 |

### Phase 3 — OAuth 전환 + 통합 분석 (추후)

**목표**: API Key → OAuth 2.0 전환, 크로스-플랫폼 전환율 분석

| 항목 | 내용 |
|------|------|
| Clozet OAuth 서버 | 표준 OAuth 2.0 인증 서버 구현 |
| share2dm OAuth 클라이언트 | API Key 방식 코드를 OAuth로 교체 |
| 통합 분석 | share2dm 클릭 → Clozet 구매 전환율 추적 (Clozet D2C의 `d2c_click_logs` 활용) |
| 브랜드 대시보드 통합 뷰 | DM 발송 수 + Clozet 구매 전환율 한 곳에서 확인 |

---

## 11. 전체 흐름 요약 (완성 상태)

```
[Clozet B.O — 콘텐츠 등록]
  Instagram URL 입력
       ↓ (자동)
  Clozet: contents 테이블 저장 + Webhook 발송
       ↓
[share2dm Worker — 웹훅 수신]
  캠페인 자동 생성:
    ig_contents_id = {media_id}
    product_url = https://app.clozet.my/reel/{short_code}
       ↓
[소비자 — Instagram]
  릴스를 브랜드 DM으로 공유 (share)
       ↓
[share2dm Worker — Instagram 웹훅 수신]
  media_id로 캠페인 매칭
  → DM 발송: "제품 링크 보내드려요! → https://share2dm.xyz/t/{...}"
       ↓
[소비자 — DM 클릭]
  share2dm 클릭 추적 (link_clicked_at 업데이트)
  → 302 Redirect: https://app.clozet.my/reel/{short_code}
       ↓
[소비자 — Clozet 앱/웹]
  릴스 시청 → 스티커 탭
  → LayoutProductPage (또는 D2C 자사몰)
  → 구매 완료
```

---

## 12. 미결 사항 및 결정 필요 사항

| 항목 | 옵션 A | 옵션 B | 우선순위 |
|------|--------|--------|---------|
| **Clozet API 인증** | API Key (즉시) | OAuth (추후) | Phase 1: A |
| **Clozet API 위치** | Supabase Edge Function | 별도 API 서버 | 결정 필요 |
| **자동 캠페인 기본 DM 문구** | 글로벌 기본값 | 브랜드별 템플릿 | Phase 2에서 결정 |
| **Clozet 미등록 릴스 처리** | 캠페인 생성 차단 | 경고 후 수동 입력 허용 | 사용자 리서치 후 결정 |
| **share2dm 플랜 — D2C 허용** | Pro 플랜만 | Growth 이상 | 영업 정책 결정 필요 |
| **클릭 후 Clozet 앱 딥링크** | 웹 URL만 | 앱 딥링크 + 웹 폴백 | Phase 3 |

---

*이 문서는 share2dm과 Clozet의 기술적 연결 방식과 단계별 구현 계획을 다룬다. 구현 전 양측 개발 팀의 API 명세 협의가 필요하다.*
