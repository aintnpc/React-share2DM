# share2dm — 릴스 공유 기반 자동 DM 마케팅 서비스

> **서비스명**: share2dm (플릭)
> **Tagline**: "댓글 없이, 흔적 없이 — 공유만으로 구매 전환"
> **Date**: 2026-02-10
> **Status**: 기획 단계

---

## Part 1: WHY — 왜 이 서비스가 필요한가

### 1.1 현재 릴스 마케팅의 문제점

인스타그램 릴스로 바이럴 마케팅 → 구매 전환을 하려면, 현재 업계 표준은 **"댓글 자동화"**다.

```
기존 방식 (ManyChat 등):
  릴스 시청 → "LINK 댓글 달면 DM으로 보내드려요!" → 댓글 작성 → 자동 DM 수신 → 구매
```

**이 방식의 근본적 문제:**

| 문제 | 설명 |
|------|------|
| **흔적이 남는다** | 댓글은 공개 기록. 팔로워, 친구, 누구나 볼 수 있다 |
| **심리적 저항** | 한국 사용자는 인스타에 흔적 안 남기려고 **부계정(부캐)**까지 만들어 쓴다 |
| **전환율 하락** | "댓글 달기" 자체가 허들. 관심 있어도 댓글은 안 단다 |
| **잠수족(Lurker) 이탈** | 인스타 사용자의 약 90%는 Lurker — 보기만 하고 반응하지 않는다. 댓글 방식은 이 90%를 놓친다 |

### 1.2 발견한 대안: 릴스 공유

Clozet 개발 중 발견한 인사이트:

> **릴스 공유(Share)는 아무런 흔적도 남지 않는다.**

| 행동 | 공개 여부 | 흔적 |
|------|----------|------|
| 좋아요 | 공개 | 활동 로그에 남음 |
| 댓글 | 공개 | 게시물에 영구 표시 |
| 저장 | 비공개 | 본인만 확인 가능 |
| **공유 (DM 전송)** | **완전 비공개** | **아무 흔적 없음** |

릴스를 특정 계정에 공유하는 행동은:
- 공개 프로필에 표시 안 됨
- 활동 로그에 안 남음
- 어떤 사람도 확인 불가
- 댓글보다 탭 수가 적음 (공유 버튼 → 계정 선택 → 전송)

**결론**: 댓글 대신 공유를 트리거로 사용하면, Lurker 90%도 전환 대상이 된다.

### 1.3 시장 기회

```
현재 시장:
  ManyChat (시장 1위) — 100만+ 비즈니스 사용 중
  전부 "댓글 기반" 자동화

share2dm이 노리는 시장:
  "댓글 달기 싫은 90%" = 현재 도구들이 놓치고 있는 거대한 시장
  공유 기반 자동화 = 경쟁자 0
```

---

## Part 2: HOW — 어떻게 작동하는가

### 2.1 사용자 흐름

```
[소비자]                              [브랜드 인스타 계정]
                                           │
릴스 시청                                   │
  ↓                                        │
"이 릴스를 @brand 계정에 공유하면            │
 구매 링크를 DM으로 보내드려요!"             │
  ↓                                        │
공유 버튼 탭 → @brand 선택 → 전송           │
  ↓                                        │
  ─────────── 릴스가 DM으로 도착 ──────────→ │
                                           │
                    Instagram Webhook 발동 ←┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   share2dm 서버     │
                  │  (CF Workers)   │
                  │                 │
                  │  1. 릴스 감지    │
                  │  2. 제품 매칭    │
                  │  3. 링크 생성    │
                  └────────┬────────┘
                           │
                           ▼
                  Instagram Send API
                           │
                  자동 DM 발송 ──────────→ [소비자 DM 수신]
                                           │
                                     "링크를 보내드려요!
                                      👉 https://brand.com/product/123"
                                           │
                                           ▼
                                      제품 페이지 → 구매
```

### 2.2 기술 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Instagram Platform                        │
│                                                             │
│  [소비자]  ──── 릴스 공유 (DM) ────→  [브랜드 계정]          │
│                                          │                  │
│                                     Webhook 발동            │
└──────────────────────────────────────────┬──────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Cloudflare Workers (Edge)                     │
│                                                             │
│  ┌───────────────────────────────────────────────┐          │
│  │  Webhook Receiver                              │          │
│  │                                                │          │
│  │  1. POST 수신 + HMAC-SHA256 서명 검증           │          │
│  │  2. messaging event 파싱                       │          │
│  │  3. attachment.type === 'ig_reel' 확인          │          │
│  │  4. reel_video_id / url 추출                   │          │
│  │  5. sender.id (공유한 사용자) 추출              │          │
│  └──────────────────┬────────────────────────────┘          │
│                     │                                       │
│                     ▼                                       │
│  ┌───────────────────────────────────────────────┐          │
│  │  Reel Matcher                                  │          │
│  │                                                │          │
│  │  - reel_video_id로 등록된 캠페인 조회           │          │
│  │  - 매칭되는 제품 링크 / 메시지 템플릿 조회       │          │
│  │  - UTM 파라미터 부착                           │          │
│  └──────────────────┬────────────────────────────┘          │
│                     │                                       │
│                     ▼                                       │
│  ┌───────────────────────────────────────────────┐          │
│  │  DM Sender                                     │          │
│  │                                                │          │
│  │  - Instagram Send API 호출                      │          │
│  │  - recipient: sender.id (공유한 사용자)          │          │
│  │  - message: 제품 링크 + 커스텀 메시지            │          │
│  │  - 200 DM/hour 레이트 리밋 관리                 │          │
│  └──────────────────┬────────────────────────────┘          │
│                     │                                       │
│                     ▼                                       │
│  ┌───────────────────────────────────────────────┐          │
│  │  D1 Database (Cloudflare)                      │          │
│  │                                                │          │
│  │  - campaigns: 릴스-제품 매핑                    │          │
│  │  - dm_logs: 발송 기록 (중복 방지, 통계)         │          │
│  │  - brands: 브랜드 계정 + 토큰                   │          │
│  │  - click_logs: UTM 클릭 추적                   │          │
│  └───────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Instagram API 활용

릴스 공유 감지에 사용하는 Instagram API:

| API | 용도 | 핵심 필드 |
|-----|------|----------|
| **Messages Webhook** | 릴스 공유 감지 | `attachment.type: "ig_reel"`, `payload.reel_video_id`, `payload.url` |
| **Send API** | 자동 DM 발송 | `POST /me/messages` — text, image, quick_reply, template |
| **Graph API** | 릴스 정보 조회 | 릴스 미디어 ID, 썸네일, 캡션 |

**24시간 메시징 윈도우**: 사용자가 릴스를 공유하는 순간이 "user-initiated contact"로 인정되어, 24시간 동안 DM 발송 가능. 공유 자체가 트리거이자 메시징 윈도우 오픈이므로, 별도 opt-in 없이 즉시 응답 가능.

### 2.4 왜 Cloudflare Workers인가

| 이유 | 설명 |
|------|------|
| **Cold start 없음** | Lambda와 달리 항상 warm. Webhook 1초 타임아웃에 안전 |
| **글로벌 Edge** | Meta 서버에서 가장 가까운 엣지에서 처리 |
| **비용** | Free tier: 일 10만 요청. $5/월 플랜: 월 1,000만 요청 |
| **D1 DB 내장** | 별도 DB 서비스 불필요. SQL 지원 |
| **이미 경험 있음** | Clozet에서 유사 작업 경험. MVP 빠르게 가능 |

---

## Part 3: WHAT — 무엇을 만드는가

### 3.1 MVP 범위

```
MVP (웹 대시보드 + Webhook 서버):

[브랜드 대시보드] (웹)
  ├─ Instagram 비즈니스 계정 연결 (OAuth)
  ├─ 캠페인 생성:
  │   ├─ 릴스 URL 입력 → reel_video_id 자동 추출
  │   ├─ 응답 메시지 템플릿 작성
  │   └─ 제품 링크(자사몰 URL) 입력
  ├─ 캠페인 통계:
  │   ├─ 공유 수 (DM 수신 수)
  │   ├─ DM 발송 수
  │   └─ 링크 클릭 수
  └─ 계정 설정

[Webhook 서버] (Cloudflare Workers)
  ├─ Instagram Webhook 수신/검증
  ├─ 릴스 공유 감지 + 캠페인 매칭
  ├─ 자동 DM 발송 (Send API)
  └─ 클릭 추적 (리다이렉트 URL)
```

### 3.2 데이터 모델 (D1)

```sql
-- 브랜드 계정
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  ig_account_id TEXT UNIQUE NOT NULL,
  ig_access_token TEXT NOT NULL,         -- 암호화 저장
  token_expires_at INTEGER,
  plan TEXT DEFAULT 'free',
  created_at INTEGER DEFAULT (unixepoch())
);

-- 캠페인 (릴스별 자동 DM 설정)
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id),
  reel_url TEXT NOT NULL,
  reel_video_id TEXT NOT NULL,            -- Webhook 매칭용 key
  response_message TEXT NOT NULL,         -- DM 메시지 템플릿
  product_url TEXT NOT NULL,              -- 자사몰 링크
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- DM 발송 로그
CREATE TABLE dm_logs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  brand_id TEXT REFERENCES brands(id),
  sender_ig_id TEXT NOT NULL,             -- 공유한 사용자
  reel_video_id TEXT,
  dm_sent_at INTEGER DEFAULT (unixepoch()),
  link_clicked_at INTEGER,                -- 클릭 추적
  UNIQUE(campaign_id, sender_ig_id)       -- 같은 캠페인에 중복 DM 방지
);
```

### 3.3 Webhook 처리 핵심 로직

```typescript
// Cloudflare Worker — 핵심 로직 (의사 코드)
export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'GET') {
      // Webhook 검증 (hub.challenge 반환)
      return handleVerification(request, env);
    }

    // POST: Webhook 이벤트 수신
    const body = await request.json();

    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        // 릴스 공유 감지
        const reelAttachment = event.message?.attachments?.find(
          (a) => a.type === 'ig_reel'
        );

        if (!reelAttachment) continue;

        const reelVideoId = reelAttachment.payload.reel_video_id;
        const senderId = event.sender.id;

        // 캠페인 매칭
        const campaign = await env.DB.prepare(
          'SELECT * FROM campaigns WHERE reel_video_id = ? AND is_active = 1'
        ).bind(reelVideoId).first();

        if (!campaign) continue;

        // 중복 체크
        const existing = await env.DB.prepare(
          'SELECT id FROM dm_logs WHERE campaign_id = ? AND sender_ig_id = ?'
        ).bind(campaign.id, senderId).first();

        if (existing) continue;

        // 추적 URL 생성
        const trackingUrl = `https://share2dm.link/${campaign.id}/${senderId}`;

        // DM 발송
        await sendDM(senderId, campaign, trackingUrl, env);

        // 로그 기록
        await env.DB.prepare(
          'INSERT INTO dm_logs (id, campaign_id, brand_id, sender_ig_id, reel_video_id) VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), campaign.id, campaign.brand_id, senderId, reelVideoId).run();
      }
    }

    return new Response('OK', { status: 200 });
  }
};
```

---

## 4. 경쟁사 분석 및 가격 비교

### 4.1 댓글 기반 자동화 서비스 (기존 시장)

| 서비스 | 무료 | 유료 시작가 | 가격 모델 | 한계 |
|--------|------|-----------|----------|------|
| **ManyChat** | 1,000 연락처, 키워드 3개 | $15/월 (500 연락처) | 연락처 수 기반 | 댓글 기반만 지원 |
| **Chatfuel** | 50 대화/월 | $23.99/월 (1,000 대화) | 대화 수 기반 | 댓글 기반만 지원 |
| **CreatorFlow** | 500 DM/월 | $15/월 (5,000 DM) | DM 수 기반 | 댓글 기반만 지원 |
| **LinkDM** | 7일 체험 | $19/월 (계정당) | 계정당 정액 | 댓글 기반만 지원 |
| **InstantDM** | 없음 | $8/월 | 정액 | 기능 제한적 |
| **ReplyRush** | 500 DM/월 | $10/월 | 정액 단계별 | 댓글 기반만 지원 |
| **Inro** | 100 연락처 | EUR 12.99/월 | 활성 연락처 기반 | 댓글 기반만 지원 |

### 4.2 핵심 차별점

```
기존 서비스 전부:
  트리거 = 댓글 (공개, 흔적 남음)
  ❌ 공유 기반 트리거 지원하는 서비스 = 0개

share2dm:
  트리거 = 릴스 공유 (비공개, 흔적 없음)
  ✅ 세계 최초 공유 기반 DM 자동화
```

**ManyChat이 공유 트리거를 안 만드는 이유:**
- ManyChat의 비즈니스 모델은 "연락처 수"로 과금 → 댓글이 연락처를 많이 모아줌
- 공유 트리거는 기술적으로 가능하지만 (messages webhook), 댓글 대비 연락처 수집 속도가 느리다고 판단
- **하지만 전환율은 공유가 훨씬 높을 수 있다** → share2dm의 가설

### 4.3 운영 비용 분석

#### Cloudflare Workers 비용

| 항목 | Free tier | $5/월 플랜 | 설명 |
|------|----------|-----------|------|
| 요청 수 | 10만/일 | **1,000만/월** | Webhook 수신 + DM 발송 + 대시보드 |
| D1 읽기 | 500만 행/일 | 250억 행/월 | 캠페인 조회, 중복 체크 |
| D1 쓰기 | 10만 행/일 | 5,000만 행/월 | DM 로그, 클릭 로그 |
| D1 저장 | 5 GB | 5 GB (초과 시 $0.75/GB) | 충분 |
| KV 읽기 | 10만/일 | 1,000만/월 | 토큰 캐시, 세션 |

#### 브랜드당 월 비용 추정

```
가정: 브랜드 1개, 월 활성 캠페인 10개, 월 공유 5,000건

Webhook 수신:     5,000 요청
캠페인 매칭 쿼리: 5,000 쿼리
DM 발송 API 호출: 5,000 요청
클릭 추적:        2,500 요청 (50% 클릭률 가정)
대시보드 조회:     1,000 요청
─────────────────────────
총:               ~18,500 요청/월

Cloudflare Workers 비용: $5/월 플랜으로 브랜드 수백 개 커버 가능
```

#### 총 인프라 비용

| 규모 | 브랜드 수 | 월 DM 발송 | CF Workers 비용 | 도메인/기타 | 총 비용 |
|------|----------|-----------|----------------|------------|---------|
| 초기 | 1-10개 | ~50,000 | $5/월 | $15/월 | **~$20/월 (약 3만원)** |
| 성장 | 10-100개 | ~500,000 | $5-10/월 | $15/월 | **~$25/월 (약 3.5만원)** |
| 스케일 | 100-1,000개 | ~5,000,000 | $20-50/월 | $30/월 | **~$80/월 (약 11만원)** |

**인프라 비용이 거의 0에 수렴한다.** Cloudflare Workers의 가격 구조상, 수백 브랜드를 서비스해도 월 10만원 미만.

### 4.4 share2dm 가격 전략

#### 경쟁사 대비 포지셔닝

```
InstantDM ($8/월) ─── ReplyRush ($10/월) ─── ManyChat Free ─── CreatorFlow ($15/월)
                                                                       │
                                                            ManyChat Pro ($15/월)
                                                                       │
                                                            LinkDM ($19/월)
                                                                       │
                                                            Chatfuel ($23.99/월)

share2dm 포지셔닝:
  → ManyChat Pro와 동일선 ($15/월) 또는 약간 위
  → "공유 기반"이라는 독점적 차별점으로 프리미엄 정당화
```

#### 가격표

| 플랜 | 월 가격 | 연간 가격 | 포함 사항 |
|------|--------|----------|-----------|
| **Free** | $0 | - | 1 캠페인, 월 100 DM, 기본 통계 |
| **Starter** | **$19/월** | $15/월 ($180/년) | 10 캠페인, 월 2,000 DM, 클릭 추적, UTM 파라미터 |
| **Growth** | **$49/월** | $39/월 ($468/년) | 무제한 캠페인, 월 10,000 DM, 상세 통계, A/B 테스트, 다중 계정 (3개) |
| **Agency** | **$149/월** | $119/월 ($1,428/년) | 무제한 전부, 무제한 계정, API 접근, 화이트라벨 |

#### 가격 근거

| 근거 | 설명 |
|------|------|
| **ManyChat Pro 대비** | ManyChat $15/월 (500 연락처) vs share2dm $19/월 (2,000 DM). DM 단가 기준으로 share2dm이 저렴 |
| **인프라 마진** | 인프라 비용 ~$20/월로 브랜드 수백 개 커버 → 마진율 95%+ |
| **대안 비용** | 브랜드가 직접 개발하면 Instagram API + 서버 + 개발자 인건비 → 월 수백만원 |
| **한국 시장** | $19 ≈ 2.7만원/월. 한국 소상공인도 부담 없는 가격대 |

#### 초과 DM 과금

| 구간 | 추가 DM 단가 |
|------|------------|
| Free 초과 | 서비스 중단 (업그레이드 유도) |
| Starter 초과 | $0.01/DM (1건당 약 14원) |
| Growth 초과 | $0.005/DM (1건당 약 7원) |
| Agency | 무제한 |

---

## 5. 개발 로드맵

### Phase 1 — MVP (2주)

이미 Clozet에서 Instagram Webhook + DM 관련 작업 경험이 있으므로 빠르게 가능.

| 주차 | 작업 |
|------|------|
| 1주 | CF Worker: Webhook 수신 + 릴스 공유 감지 + DM 발송 |
| 1주 | D1 DB: brands, campaigns, dm_logs 테이블 |
| 2주 | 웹 대시보드: Instagram OAuth + 캠페인 CRUD + 기본 통계 |
| 2주 | 클릭 추적 리다이렉트 URL (share2dm.link/{id}) |

### Phase 2 — 고도화 (2주)

| 주차 | 작업 |
|------|------|
| 3주 | A/B 테스트 (메시지 템플릿 변형), 다중 계정 지원 |
| 4주 | 상세 통계 대시보드 (전환율, 시간대별, 릴스별) |

### Phase 3 — 스케일 (이후)

| 항목 | 설명 |
|------|------|
| 댓글 트리거 추가 | 공유 + 댓글 모두 지원하여 ManyChat 직접 대체 |
| Shopify 연동 | 제품 카탈로그 자동 동기화 |
| 한국어 랜딩/마케팅 | 국내 인플루언서/브랜드 대상 GTM |

---

## 6. GTM (Go-to-Market) 전략

### 6.1 초기 타겟

| 세그먼트 | 이유 |
|----------|------|
| **인스타 기반 소규모 브랜드** | 릴스 마케팅 이미 하고 있음. 댓글 전환율에 불만 |
| **인플루언서/크리에이터** | 팔로워에게 "공유하면 링크 보내줄게"가 자연스러움 |
| **ManyChat 무료 사용자** | 키워드 3개 제한에 불만인 사용자 → share2dm Free로 유인 |

### 6.2 핵심 메시지

**브랜드 대상:**
> "댓글 달라고 하면 10명 중 1명만 한다. 공유하라고 하면 10명 중 5명이 한다.
> 흔적 없으니까."

**크리에이터 대상:**
> "팔로워한테 '이 릴스 나한테 공유해줘'만 하면 자동으로 링크 보내줌.
> 댓글 안 달아도 됨. 설정 2분."

### 6.3 입소문 루프

```
크리에이터가 릴스에서 "공유하면 링크 보내줘요" 멘트
  ↓
팔로워가 릴스 공유 (흔적 없음 → 저항 낮음)
  ↓
자동 DM 수신: "링크 보내드려요! 🔗 ... (Powered by share2dm)"
  ↓
팔로워: "이거 뭐지? 신기하다" → share2dm 검색 → 본인도 가입
```

**Powered by share2dm** 워터마크가 바이럴 루프 역할.

---

## 7. 리스크 및 대응

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| Instagram API 정책 변경 | 높음 | messages webhook은 공식 API의 핵심 기능. 제거 가능성 낮음. 변경 시 빠르게 대응 |
| ManyChat이 공유 트리거 추가 | 중간 | 선점 우위 + 공유 특화 UX로 차별화. ManyChat은 "모든 것"을 하려 해서 공유 최적화에 집중 어려움 |
| `is_unsupported` 메시지 (비공개 계정 릴스) | 중간 | 비공개 계정 릴스는 payload 없이 도착. 이 경우 "릴스를 확인할 수 없어요. 공개 계정 릴스를 공유해주세요" 안내 DM |
| 200 DM/hour 레이트 리밋 | 낮음 | Queue 기반 순차 발송. 대부분 브랜드는 시간당 200 미만. 초과 시 1시간 후 자동 재개 |
| 브랜드 토큰 만료 | 낮음 | 자동 갱신 Cron + 만료 7일 전 알림 |

---

## 8. 성공 지표

### MVP 검증 (출시 후 1개월)

| 지표 | 목표 |
|------|------|
| 가입 브랜드 수 | 50+ |
| 총 DM 발송 수 | 10,000+ |
| 공유 → DM 발송 성공률 | 95%+ |
| DM 내 링크 클릭률 | 30%+ |

### 성장 (출시 후 6개월)

| 지표 | 목표 |
|------|------|
| 유료 전환율 | Free → Paid 10%+ |
| 월 반복 매출 (MRR) | $5,000+ (약 700만원) |
| 월 DM 발송 수 | 500,000+ |

---

## 9. 요약

```
WHY:  댓글 = 흔적 남음 → 90%가 안 함. 공유 = 흔적 없음 → 전환 허들 제거.
HOW:  릴스 공유 → Instagram Webhook 감지 → 자동 DM 발송 (Cloudflare Workers)
WHAT: 웹 대시보드 + Webhook 서버. MVP 2주. 인프라 비용 월 3만원.
```

**share2dm은 "댓글 달아주세요"를 "공유해주세요"로 바꾸는 것만으로, 기존 도구들이 놓치고 있는 90%의 Lurker를 전환 대상으로 만든다.**
