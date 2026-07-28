# Engineering Workflow — Production Level
## طريقة بناء Software من الفكرة للتنفيذ

> هذا الملف يصف الطريقة الكاملة للعمل في كل مشروع.
> مُحدَّث ليعكس مستوى Production حقيقي مع Documentation كاملة.

---

## المبدأ الأساسي

```
قبل أي كود:
افهم → حلل → وثّق → خطط → نفّذ → اختبر

الـ Code هو آخر خطوة — مش أول خطوة.
الـ Documentation ليست Luxury — هي جزء من المنتج نفسه.
```

---

## Phase 0 — Product Discovery

### الهدف
فهم المشروع من جذوره. لا كود. لا قرارات تقنية. فقط فهم.

### الخطوات

**أولاً — تعريف المنتج بجملة واحدة**
```
"نحن نبني ماذا بالضبط؟"
الإجابة = جملة واحدة واضحة لا تقبل التأويل.

❌ "نبني نظام ذكي متعدد الوظائف"
✅ "نبني AI Agent Security Monitoring Platform"
```

**تانياً — تحديد الـ Actors**
```
من هم المستخدمون؟
لكل Actor:
├── من هو؟ (Human User? SDK Client? External Service?)
├── كيف يتحقق من هويته؟ (JWT? API Key?)
├── ماذا يريد؟
└── ما الذي يستطيع فعله؟
```

**تالثاً — استخراج الـ Features وتصنيفها**
```
لكل Actor → ما الذي يقدر يعمله؟

✅ V1 Core    → لازم الآن
⭐ Future    → يتأجل لاحقاً

القاعدة: MVP صغير يعمل جيداً > نظام كبير معقد
```

**رابعاً — Business Flow**
```
كيف تتحرك البيانات من البداية للنهاية؟
ارسمه بالكلام العادي — ليس بالكود.

مثال:
Agent ينفذ Task
→ SDK تجمع Events
→ Observation تُرسل للـ Backend
→ Backend يتحقق ويحفظ
→ ML يحلل
→ Prediction تُحفظ
→ Dashboard يعرض
```

**خامساً — Architecture Decisions (ADRs)**
```
لكل قرار معماري كبير:
├── ما السياق؟ (Context)
├── ما القرار؟ (Decision)
├── لماذا؟ (Rationale)
├── ما البدائل المرفوضة؟
└── ما العواقب؟ (Consequences)

ADR = Architecture Decision Record
يُحفظ في docs/adrs/ ولا يُحذف أبداً.
```

---

## Phase 1 — Database Design

### الهدف
قاعدة بيانات صحيحة من أول يوم. الغلطة هنا مكلفة جداً.

### الخطوات

**أولاً — Domain Model أولاً**
```
قبل الجداول — حدد الـ Entities بلغة Business:

Organization → Agent → Observation → Prediction → Alert

مش أسماء جداول — أسماء Business.
```

**تانياً — رسم ERD**
```
تحديد:
├── Root Entities   → لا تعتمد على شيء
├── Dependent       → تعتمد على Root
└── Junction Tables → تحل many-to-many
```

**تالثاً — Schema Review قبل أي كود**
```
أسئلة لكل جدول:
├── ما الغرض الحقيقي من هذا الجدول؟
├── هل كل عمود له سبب واضح؟
├── هل الـ Relationships صحيحة؟
├── UUID أم Integer? ولماذا؟
├── Soft Delete أم Status Enum؟
├── JSON/JSONB أم تفكيك لجداول؟
└── ما الـ Indexes المطلوبة فعلاً؟
```

**رابعاً — القرارات المعمارية للـ Database**
```
UUID Strategy:
→ UUID v7 (مرتب زمنياً) مش UUID v4 (عشوائي)
→ ليه؟ أداء أفضل في B-Tree Index + Chronological ordering

Multi-Tenancy:
→ company_id في كل جدول Business (Shared DB)
→ مش Database per Tenant (Over Engineering في V1)

Soft Delete:
→ Status Enum (ACTIVE/ARCHIVED/DISABLED)
→ مش deleted_at column في كل جدول

JSON Storage:
→ JSONB للبيانات الغنية غير المنظمة (Observations, Predictions)
→ Columns عادية للبيانات التي يُستعلَم عليها
→ المبدأ: "Store for Query, Keep the Rest as Document"

Immutability:
→ Observations لا تُعدَّل أبداً بعد الحفظ
→ Predictions تُحفظ منفصلة عن Observations
→ ليه؟ Forensic Integrity + Future Re-analysis

Cascade vs Restrict:
→ البيانات المالية والتاريخية → RESTRICT
→ مفيش CASCADE في Production Data حساسة
```

**خامساً — شجرة التبعية (Migration Order)**
```
Root Entity أولاً → ثم ما يعتمد عليه بالتسلسل

مثال SentinelX:
001 companies (Root)
002 users          → companies
003 agents         → companies
004 api_keys       → agents
005 observations   → companies + agents
006 predictions    → observations
007 alerts         → predictions

القاعدة: أرقام الـ Migrations لا تُعاد أبداً في Production.
```

---

## Phase 2 — API Design (قبل Implementation)

### الهدف
تصميم الـ API كـ Product — مش مجرد implementation detail.

### مبادئ الـ API

```
Resource-Oriented:
→ /agents, /observations, /alerts
→ ليست أسماء جداول

Predictable:
→ GET /agents, POST /agents, GET /agents/{id}, PATCH /agents/{id}
→ نفس النمط لكل Resource

Versioned من اليوم الأول:
→ /api/v1/
→ يسمح بـ /api/v2/ مستقبلاً بدون كسر Clients

Authentication:
→ JWT للـ Human Users (Dashboard)
→ API Key للـ SDK Clients (Agents)

Stable:
→ لا Breaking Changes بعد النشر
→ أي تغيير جذري = Version جديد
```

### HTTP Status Codes المهمة
```
200 → OK (GET, PATCH)
201 → Created (POST أنشأ resource)
202 → Accepted (POST قُبل للمعالجة الـ Async)
204 → No Content (DELETE, Logout)
400 → Bad Request
401 → Unauthenticated
403 → Forbidden
404 → Not Found
409 → Conflict (Duplicate)
422 → Validation Error
429 → Rate Limit
500 → Server Error
503 → Service Unavailable (ML down)
```

**لماذا 202 وليس 200؟**
```
202 Accepted = "تم الاستلام، المعالجة جارية بشكل Async"
200 OK       = "تم الاستلام والمعالجة"

مثال: POST /observations
→ Receive → Validate → Store → Queue → ML
→ المعالجة لم تنتهِ بعد عند الرد
→ 202 هو الصحيح
```

---

## Phase 3 — Feature Analysis (قبل كل Feature)

### الهدف
تحليل كامل قبل أي كود. هذا هو أهم جزء في العملية.

### ما يجب تحليله لكل Feature

**أولاً — Specification**
```
ما الوظيفة الحقيقية لهذه الـ Feature؟
من يستخدمها؟ بأي Authentication؟
ما الـ Business Rules؟
```

**تانياً — Architecture Decisions**
```
ما القرارات المعمارية الخاصة بهذه الـ Feature؟
هل نحتاج Queue/Job؟
هل في External Service (ML, Email)?
هل في Async Processing؟
```

**تالثاً — API Contract**
```
لكل Endpoint:
Method + URL + Auth Type
Request Body (كل field وتحقيقه)
Success Response (Status + Body)
Error Responses (كل حالة خطأ)
```

**رابعاً — Implementation Tree**
```
Feature X:
├── DTO Layer
│   └── XData.php
├── Request/Validation Layer
│   └── XRequest.php
├── Repository Layer
│   └── XRepository.php
├── Service Layer
│   └── XService.php
├── Job Layer (إن وُجد)
│   └── ProcessXJob.php
├── Resource Layer
│   └── XResource.php
├── Policy Layer (إن وُجد)
│   └── XPolicy.php
├── Controller
│   └── XController.php
├── Routes
└── Tests
    ├── Unit (XServiceTest)
    └── Feature (XApiTest)
```

**خامساً — شكل الـ Requests والـ Responses**
```
حدد بالضبط قبل الكود:

Request:
{
  "field": "type | required/optional | validation rules"
}

Response (Success):
{
  "data": { ... }
}

Response (Error):
{
  "message": "...",
  "errors": { "field": ["..."] }
}
```

---

## Phase 4 — Implementation

### الـ Loop الأساسي لكل Feature

```
DTO → Repository → Service → Job (إن لزم) → Controller → Routes → Tests
```

### DTO (Data Transfer Object)
```php
// نقل البيانات بين الـ Layers بشكل آمن
// مش Arrays مش typed

final class CreateAgentData
{
    public function __construct(
        public readonly string $name,
        public readonly string $framework,
        public readonly ?string $description,
    ) {}

    public static function fromRequest(CreateAgentRequest $request): self
    {
        return new self(
            name:        $request->validated('name'),
            framework:   $request->validated('framework'),
            description: $request->validated('description'),
        );
    }
}
```

### Repository Layer
```php
// المسؤولية الوحيدة: التواصل مع قاعدة البيانات

interface AgentRepositoryInterface
{
    public function create(array $data): Agent;
    public function findById(string $id): ?Agent;
    public function findByCompany(string $companyId): Collection;
}

class AgentRepository implements AgentRepositoryInterface
{
    // Implementation هنا
    // مش في Service أو Controller
}
```

### Service Layer
```php
// Business Logic فقط — مش DB queries مباشرة

class AgentService
{
    public function __construct(
        private readonly AgentRepositoryInterface $agentRepository,
        private readonly ApiKeyService $apiKeyService,
    ) {}

    public function createAgent(Company $company, CreateAgentData $data): Agent
    {
        // Business rules هنا
        // تفويض لـ Repository للـ DB
        // تفويض لـ Job للـ Async work
    }
}
```

### Job Layer (للـ Async Processing)
```php
// كل عملية لا تحتاج نتيجتها فورياً = Job

class ProcessObservationJob implements ShouldQueue
{
    public function __construct(
        private readonly string $observationId
    ) {}

    public function handle(
        ObservationRepository $repo,
        MlClientService $mlClient,
    ): void {
        // 1. جيب الـ Observation
        // 2. ابعت للـ ML
        // 3. احفظ الـ Prediction
        // 4. قيّم الـ Alert Policy
    }
}
```

### Policy Layer
```php
// Authorization Logic منفصلة عن Business Logic

class AgentPolicy
{
    public function view(User $user, Agent $agent): bool
    {
        return $user->company_id === $agent->company_id;
    }

    public function update(User $user, Agent $agent): bool
    {
        return $user->company_id === $agent->company_id;
    }
}
```

### Controller
```php
// Traffic Director فقط — 3-5 سطور كحد أقصى

class AgentController extends Controller
{
    public function __construct(
        private readonly AgentService $agentService
    ) {}

    public function store(CreateAgentRequest $request): JsonResponse
    {
        $data  = CreateAgentData::fromRequest($request);
        $agent = $this->agentService->createAgent(
            $request->user()->company,
            $data
        );

        return ApiResponse::created(new AgentResource($agent));
    }
}
```

### FormRequest
```php
// Validation فقط — مش business rules

public function rules(): array
{
    return [
        'name'      => ['required', 'string', 'max:255'],
        'framework' => ['required', 'string'],
    ];
}

// authorize() = Policy Check
public function authorize(): bool
{
    return true; // Policy في مكانها الصحيح
}
```

---

## Phase 5 — Testing

### فلسفة الـ Testing

```
"بكتب test عشان أثبت إن الكود يتصرف صح
في كل الحالات — حتى الحالات الغلط."

Unit Tests:
→ Service + Repository بشكل معزول
→ Mock كل dependencies

Feature Tests:
→ HTTP Request → DB → Response
→ الـ Pipeline كامل من البداية للنهاية

Integration Tests (للـ External Services):
→ ML Client
→ Email Service
→ Fakes/Mocks دايماً
```

### الأنواع الخمسة لكل Feature
```
1. Happy Path         → الحالة الطبيعية
2. Edge Cases         → الحالات الحدية
3. Business Rules     → القواعد التجارية
4. Authorization      → مين مسموحله بإيه
5. Data Isolation     → Multi-Tenant: شركة A مش تشوف بيانات B
```

### Fakes في الـ Tests
```php
Queue::fake()    // بدل Queue Worker حقيقي
Mail::fake()     // بدل Mail Server
Storage::fake()  // بدل Disk
Http::fake()     // بدل External HTTP calls
$this->mock(MlClientService::class, ...) // بدل ML Service
```

### Multi-Tenant Isolation Tests
```php
// دايماً تأكد إن الـ Company A مش تشوف بيانات Company B

public function company_a_cannot_see_company_b_agents(): void
{
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $agentB   = Agent::factory()->for($companyB)->create();
    $userA    = User::factory()->for($companyA)->create();

    $this->actingAs($userA)
         ->getJson("/api/v1/agents/{$agentB->id}")
         ->assertStatus(404); // 404 مش 403 — Security Through Obscurity
}
```

---

## Phase 6 — Security Hardening

### ما يجب بعد كل Phase من Implementation

```
✅ ApiResponse Helper   → Consistent JSON responses
✅ Exception Handler    → JSON errors دايماً، مش HTML
✅ Rate Limiting        → Login:5/min, SDK:varied, Dashboard:100/min
✅ CORS                 → Specific origins مش *
✅ N+1 Review           → Eager Loading دايماً في Collections
✅ Multi-Tenant Check   → كل Scoped Query تبدأ من الـ Company
```

### API Key Security
```php
// لا يُخزَّن الـ API Key أبداً
// يُخزَّن hash فقط (مثل password)

$keyHash   = hash('sha256', $plainKey);
$keyPrefix = substr($plainKey, 0, 12); // للعرض فقط

// مثل: sk_live_ab12xxxx...
// الـ prefix ظاهر للمستخدم
// الـ hash محفوظ في DB
// الـ plain key لا يُخزَّن أبداً
```

---

## Phase 7 — Documentation Update

### بعد كل Feature تنتهي منها
```
✅ API Reference محدّث
✅ CHANGELOG.md محدّث
✅ Postman Collection محدّث
✅ README.md محدّث إن احتاج
```

### Postman Collection
```
Auto-Token Script بعد Login:
→ Token يتحفظ تلقائياً

Auto-API-Key Script بعد Agent Creation:
→ API Key يتحفظ تلقائياً للـ SDK Endpoints

Environments:
→ development: localhost
→ staging:     staging.sentinelx.ai
→ production:  api.sentinelx.ai
```

---

## الـ Patterns الثابتة في كل مشروع

### Pattern 1 — Multi-Tenant Scoping
```php
// كل Query تبدأ من الـ Company
// مش من الـ Model مباشرة

// ❌ خطر
Agent::find($agentId);

// ✅ صح
$request->user()->company->agents()->find($agentId);
// أو:
Agent::where('company_id', $companyId)->find($agentId);
```

### Pattern 2 — API Key Resolution
```php
// API Key → Agent → Company
// في كل SDK request:

$hashedKey = hash('sha256', $request->bearerToken());
$apiKey    = ApiKey::where('key_hash', $hashedKey)
                   ->where('status', 'ACTIVE')
                   ->with('agent.company')
                   ->firstOrFail();

$agent   = $apiKey->agent;
$company = $agent->company;
```

### Pattern 3 — Async Processing (202 Pattern)
```php
// 1. استقبل → 2. تحقق → 3. احفظ → 4. Queue → 5. ردّ 202

public function store(SubmitObservationRequest $request): JsonResponse
{
    $observation = $this->observationService->store(
        $request->resolvedAgent(),
        $request->validated()
    );

    ProcessObservationJob::dispatch($observation->id);

    return ApiResponse::accepted([
        'observation_id' => $observation->id,
        'status'         => 'PENDING',
    ]);
    // 202 مش 200 — المعالجة لم تنتهِ بعد
}
```

### Pattern 4 — Immutable Record
```php
// Observations لا تُعدَّل أبداً
// Predictions منفصلة

// ❌ ممنوع
$observation->update(['analysis_result' => $result]);

// ✅ صح
Prediction::create([
    'observation_id' => $observation->id,
    'verdict'        => $result['verdict'],
    'prediction_json'=> $result,
]);
```

### Pattern 5 — Alert Policy Evaluation
```php
// ML يعطي Prediction
// Backend يقرر هل يُنشئ Alert

// ML: "verdict = SUSPICIOUS"
// Backend Policy: "إذا verdict != SAFE → أنشئ Alert"

class AlertPolicyService
{
    public function evaluate(Prediction $prediction): ?Alert
    {
        if ($prediction->verdict === VerdictEnum::SAFE) {
            return null; // لا alert للـ SAFE
        }

        return Alert::create([
            'prediction_id' => $prediction->id,
            'severity'      => $this->mapRiskToSeverity($prediction->risk_score),
            'status'        => AlertStatusEnum::OPEN,
        ]);
    }
}
```

### Pattern 6 — Service Return Format
```php
// دايماً ارجع typed data مش arrays
// استخدم DTOs أو Exceptions

// ❌
return ['success' => false, 'reason' => 'not_found'];

// ✅
throw new ObservationNotFoundException($id);
// أو:
return ObservationResult::notFound($id);
```

---

## القرارات المعمارية الثابتة

| القرار | السبب |
|--------|--------|
| UUID v7 مش v4 | مرتب زمنياً → أداء أفضل في Index |
| JWT للـ Dashboard | Stateless + Human Users |
| API Key للـ SDK | أبسط للـ Agents + لا Session |
| JSONB للـ Observations | Immutability + Schema Evolution |
| Service Layer | فصل Business Logic |
| Repository Layer | فصل Database Logic |
| DTO Layer | Type Safety بين الـ Layers |
| Policy Layer | Authorization منفصلة |
| 202 للـ Observations | Async Processing |
| RESTRICT مش CASCADE | حماية البيانات التاريخية |
| company_id في observations | Performance + Multi-Tenant |

---

## في كل Session جديدة

```
1. افتح هذا الملف أول حاجة.
2. افتح الـ Documentation docs/ وراجع الـ Context.
3. حدد الـ Feature أو المرحلة الجاية.
4. حلل قبل ما تكتب أي كود.
5. نفّذ الـ Implementation Tree بالترتيب.
6. اكتب الـ Tests قبل ما تكمل للـ Feature التالية.
7. وثّق أي قرار جديد في الـ ADRs.
```

---

## ملاحظات مهمة

```
1. الـ Documentation جزء من المنتج — مش optional.

2. ADR لكل قرار معماري — حتى لو يبدو صغيراً.

3. Multi-Tenancy في كل سطر كود — مش ملحق يُضاف بعدين.

4. Immutability في البيانات التاريخية — لا استثناء.

5. Async للـ ML Processing — Backend لا ينتظر ML.

6. API Key لا يُخزَّن أبداً — hash فقط.

7. 404 مش 403 للـ Multi-Tenant resource access.

8. UUID v7 مش Integer ومش UUID v4.

9. JSONB للبيانات الغنية + Columns للاستعلام.

10. الـ Simple Solution أحسن من الـ Complex Solution
    إلا لو الـ Complex مبرر بـ Business Requirement واضح.
```
