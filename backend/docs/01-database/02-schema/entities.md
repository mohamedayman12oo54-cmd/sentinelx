# Entities (Schema Reference)

> ده الملف العملي الرئيسي. كل جدول موصوف بالكامل: الغرض، كل عمود وسبب وجوده، القواعد، والشكل النهائي.
> للـ Constraints بالتفصيل → [`constraints.md`](./constraints.md). للـ Indexes → [`indexes.md`](./indexes.md). للـ Enums → [`enums.md`](./enums.md).

---

## نظرة عامة على الجداول السبعة

```text
companies → users
          → agents → api_keys
                   → observations → predictions → alerts
```

| # | الجدول | النوع | يعتمد على |
|---|--------|------|-----------|
| 1 | `companies` | Structured | — (Root) |
| 2 | `users` | Structured | `companies` |
| 3 | `agents` | Structured | `companies` |
| 4 | `api_keys` | Structured | `agents` |
| 5 | `observations` | Hybrid (JSONB) | `companies`, `agents` |
| 6 | `predictions` | Hybrid (JSONB) | `observations` |
| 7 | `alerts` | Structured | `predictions` |

---

## 1. `companies`

### الغرض
الـ Root Entity للنظام كله. كل Tenant في المنصة هو Company. العميل الحقيقي بيسجل شركة، مش حساب شخصي (`Register Company` مش `Register User`).

### الأعمدة

| العمود | النوع | Required | الوصف |
|--------|------|----------|-------|
| `id` | UUID v7 | ✅ | Primary Key |
| `name` | String | ✅ | اسم الشركة. **ليس Unique** — ممكن شركتين بنفس الاسم التجاري |
| `slug` | String | ✅ | مُعرّف فريد قابل للاستخدام في URL (مثل `microsoft`, `google`). مُجهّز لاستخدامه لاحقًا في مسارات مثل `sentinelx.ai/microsoft` أو Subdomain `microsoft.sentinelx.ai` |
| `status` | Enum | ✅ | `ACTIVE` \| `SUSPENDED` فقط. لا يوجد `ARCHIVED` أو `PENDING` في V1 |
| `created_at` | Timestamp | ✅ | |
| `updated_at` | Timestamp | ✅ | |

### قرارات مهمة
- **لا يوجد عمود `owner_id`**: الشركة كيان مستقل، والمستخدم كيان مستقل. العلاقة هي "User belongs to Company"، وليس "Company belongs to Owner" — هذا يفتح الباب مستقبلًا لدعم نقل الملكية، أكثر من Owner، ودعوة أعضاء، بدون إعادة تصميم القاعدة.
- **مفيش Soft Delete**: الحالة `SUSPENDED` كافية لتمثيل توقف الشركة عن الاستخدام دون فقد البيانات.

### الشكل النهائي
```text
companies
──────────────────────
id (UUID v7)         PK
name
slug                  UNIQUE
status                ACTIVE | SUSPENDED
created_at
updated_at
```

---

## 2. `users`

### الغرض
الأشخاص المنتمين لشركة. الـ User **مش هو العميل**، هو مجرد شخص ينتمي لشركة (Ahmed works for Microsoft — وليس Ahmed owns the platform).

### الأعمدة

| العمود | النوع | Required | الوصف |
|--------|------|----------|-------|
| `id` | UUID v7 | ✅ | Primary Key |
| `company_id` | UUID (FK) | ✅ | يشير إلى `companies.id` |
| `full_name` | String | ✅ | |
| `email` | String | ✅ | **Unique عالميًا** (مش داخل الشركة فقط) — في V1: مستخدم واحد = حساب واحد |
| `password_hash` | String | ✅ | Hash فقط، أبدًا Plain Text |
| `role` | Enum | ✅ | `OWNER` \| `MEMBER` فقط. لا يوجد Admin/Viewer في V1 — تجنبًا للـ Over Engineering قبل بناء RBAC كامل لاحقًا |
| `status` | Enum | ✅ | `ACTIVE` \| `DISABLED` |
| `last_login_at` | Timestamp | ❌ اختياري | آخر تسجيل دخول |
| `email_verified_at` | Timestamp | ❌ اختياري (Nullable) | `NULL` = لم يتم التحقق من الإيميل بعد. يُملأ مرة واحدة عند نجاح التحقق عبر رابط موقّع (Signed URL). **عمود مضاف لاحقًا** — راجع [`../../02-auth/adr/ADR-006-email-verified-at-column.md`](../../02-auth/adr/ADR-006-email-verified-at-column.md) |
| `created_at` | Timestamp | ✅ | |
| `updated_at` | Timestamp | ✅ | |

### قرارات مهمة
- `email` Unique عالميًا وليس داخل نطاق الشركة، لأن الشخص غالبًا يستخدم نفس الإيميل بغض النظر عن الشركة. دعم انتماء مستخدم لأكثر من شركة (لو احتجناه لاحقًا) سيُحل عبر طبقة Membership منفصلة، وليس بتخفيف الـ Unique Constraint.
- لا يوجد `deleted_at` — `DISABLED` هي الحالة المعبّرة عن توقف المستخدم.
- `email_verified_at` **مستقل تمامًا** عن `status` — مستخدم ممكن يكون `ACTIVE` وغير موثّق الإيميل بنفس الوقت (فترة التسجيل)، و`DISABLED` لا تعني ولا تتضمن أبدًا "غير موثّق". لا علاقة بين العمودين. راجع [`ADR-006`](../../02-auth/adr/ADR-006-email-verified-at-column.md) للسياق الكامل.

### الشكل النهائي
```text
users
──────────────────────
id (UUID v7)           PK
company_id              FK → companies.id
full_name
email                    UNIQUE (Global)
password_hash
role                     OWNER | MEMBER
status                   ACTIVE | DISABLED
last_login_at
email_verified_at        Nullable — ADR-006
created_at
updated_at
```

---

## 3. `agents`

### الغرض
**الـ Agent هو العميل الحقيقي للمنصة** — الإنسان (User) مجرد مراقب. الـ Agent عندنا مفهوم أوسع من "اسم" أو "Bot": هو **Identity + Security Principal** — له هوية مستقلة، وبيثبت شخصيته للنظام باستخدام API Key. يعني أقرب لمفهوم "Service Account" منه لـ "User" عادي.

### الأعمدة

| العمود | النوع | Required | الوصف |
|--------|------|----------|-------|
| `id` | UUID v7 | ✅ | Primary Key |
| `company_id` | UUID (FK) | ✅ | يشير إلى `companies.id` |
| `name` | String | ✅ | اسم واضح للمستخدم البشري (مثل "Support Agent") |
| `framework` | String | ✅ | الإطار المستخدم لبناء الـ Agent، جاي من ASES Context (مثل `CrewAI`, `LangGraph`, `OpenAI Agents SDK`, `AutoGen`). يُستخدم لاحقًا في Dashboard, Analytics, CVE Correlation |
| `framework_version` | String | ❌ اختياري | مثل `1.2.0` |
| `description` | Text | ❌ اختياري | مفيد للشركات ذات عشرات الـ Agents |
| `status` | Enum | ✅ | `ACTIVE` \| `ARCHIVED` فقط — لا يوجد `DISABLED` لأن الـ Lifecycle الحقيقي هو "Archive Agent" كـ Business Action |
| `last_seen_at` | Timestamp | ❌ اختياري | يتحدث تلقائيًا كل مرة يبعث فيها الـ Agent Observation. يُستخدم في عرض "Last Seen: 2 minutes ago" في الـ Dashboard |
| `created_at` | Timestamp | ✅ | |
| `updated_at` | Timestamp | ✅ | |

### قرارات مهمة
- **لا يوجد عمود API Key هنا**: الـ API Key له دورة حياة مستقلة تمامًا (Rotate, Revoke, Created, Last Used) وبالتالي جدول منفصل. راجع [`decisions/adr-004-api-key-strategy.md`](../decisions/adr-004-api-key-strategy.md).
- `name` Unique **داخل الشركة فقط** وليس عالميًا (`UNIQUE(company_id, name)`).

### الشكل النهائي
```text
agents
──────────────────────
id (UUID v7)              PK
company_id                 FK → companies.id
name
framework
framework_version
description
status                     ACTIVE | ARCHIVED
last_seen_at
created_at
updated_at
```

---

## 4. `api_keys`

### الغرض
Credential مستقل يمثل هوية الـ Agent الأمنية عند الاتصال بالمنصة. جدول مستقل عن `agents` لأن الـ Credentials لها دورة حياة مختلفة تمامًا عن الـ Entity نفسه (Rotation, Revocation, Audit).

### الأعمدة

| العمود | النوع | Required | الوصف |
|--------|------|----------|-------|
| `id` | UUID v7 | ✅ | Primary Key |
| `agent_id` | UUID (FK) | ✅ | يشير إلى `agents.id` |
| `key_prefix` | String | ✅ | جزء ظاهر للمستخدم فقط للعرض (مثل `sk_live_ab12`) — **ليس** المفتاح الحقيقي |
| `key_hash` | String | ✅ | المفتاح الحقيقي **لا يُخزَّن أبدًا** — يُخزَّن Hash فقط، مثل كلمة المرور |
| `status` | Enum | ✅ | `ACTIVE` \| `REVOKED` |
| `last_used_at` | Timestamp | ❌ اختياري | آخر استخدام فعلي للمفتاح |
| `expires_at` | Timestamp | ❌ اختياري | مُضاف من V1 احتياطًا حتى لو لم يُستخدم فعليًا بعد |
| `created_at` | Timestamp | ✅ | |
| `updated_at` | Timestamp | ✅ | موجود للتوافق مع باقي الجداول (Consistency) رغم أن السجل شبه Immutable عمليًا |

### قرارات مهمة
- العلاقة `Agent (1) → API Keys (∞)` — **وليست One-to-One** — لدعم Key Rotation دون فقدان تاريخ المفاتيح القديمة (تُحفظ كـ `REVOKED` لأغراض الـ Audit).
- **Business Rule (وليس Database Constraint):** مفتاح واحد فعّال (`ACTIVE`) فقط في أي وقت لكل Agent. القاعدة تسمح تقنيًا بأكثر من سجل، لكن التطبيق (Application Layer) هو من يضمن الالتزام بهذه القاعدة — لتسهيل الـ Rotation بدون أي لحظة انقطاع.

راجع التفاصيل الكاملة في [`decisions/adr-004-api-key-strategy.md`](../decisions/adr-004-api-key-strategy.md).

### الشكل النهائي
```text
api_keys
──────────────────────
id (UUID v7)             PK
agent_id                  FK → agents.id
key_prefix
key_hash                  UNIQUE
status                    ACTIVE | REVOKED
last_used_at
expires_at
created_at
updated_at
```

---

## 5. `observations`

### الغرض
**الجدول الأهم في المشروع كله.** الـ Observation ليس Log — هو **وثيقة أمنية رسمية (Security Document)**. لهذا يُخزَّن كامل الـ ASES JSON كما وصل من الـ SDK، دون أي تفكيك.

### الأعمدة

| العمود | النوع | Required | الوصف |
|--------|------|----------|-------|
| `id` | UUID v7 | ✅ | Primary Key |
| `company_id` | UUID (FK) | ✅ | **Denormalization متعمّد** — رغم إمكانية استنتاجها من `agent_id`. راجع القرار المعماري أسفل هذا الجدول |
| `agent_id` | UUID (FK) | ✅ | يشير إلى `agents.id` |
| `analysis_status` | Enum | ✅ | `PENDING` \| `PROCESSING` \| `COMPLETED` \| `FAILED` — التحليل Asynchronous، فهذا العمود يعكس مرحلة الدورة الكاملة |
| `raw_ases_json` | JSONB | ✅ | **قلب الجدول** — ASES JSON الكامل كما وصل من الـ SDK. هذا هو الـ Source of Truth. لا يُفكَّك لجداول Events |
| `received_at` | Timestamp | ✅ | وقت وصول الـ SDK فعليًا (مختلف عن `created_at` منطقيًا حتى لو تطابقا عمليًا) |
| `processing_started_at` | Timestamp | ❌ اختياري | وقت بدء الـ ML بمعالجة الـ Observation |
| `processed_at` | Timestamp | ❌ اختياري | وقت انتهاء المعالجة |
| `created_at` | Timestamp | ✅ | وقت إنشاء السجل نفسه |
| `updated_at` | Timestamp | ✅ | |

### قرارات مهمة
- **لا يوجد عمود `sdk_version`**: موجود بالفعل داخل `raw_ases_json`، ولا يُستعلَم عليه — فلا داعي لاستخراجه.
- **لا يوجد تفكيك للـ Events**: قرار قديم مؤكَّد من بداية المشروع — الـ Events تبقى جزء من الـ JSON الكامل.
- **لا يوجد عمود `prediction_id`**: العلاقة العكسية أنظف — الـ Prediction هو من يشير إلى الـ Observation، مما يبقي الـ Observation مستقلاً حتى لو فشل الـ ML.

### القرار المعماري الأهم: لماذا `company_id` موجود رغم التكرار؟

هذا **Denormalization محسوب** وليس تكرار عشوائي:
- تقريبًا كل استعلام في الـ Dashboard يبدأ بـ `company_id`.
- يُعفي من `JOIN` مع جدول `agents` في أغلب عمليات القراءة.
- يعزل الـ Observation عن أي تغييرات مستقبلية في بيانات الـ Agent.
- يجعل الاستعلامات الأساسية أسرع وأبسط.

القاعدة العامة: *Normalize by default... Denormalize only when it clearly improves real business queries.*

### الشكل النهائي
```text
observations
──────────────────────────
id (UUID v7)                 PK
company_id                    FK → companies.id
agent_id                      FK → agents.id
analysis_status                PENDING | PROCESSING | COMPLETED | FAILED
raw_ases_json (JSONB)
received_at
processing_started_at
processed_at
created_at
updated_at
```

---

## 6. `predictions`

### الغرض
نتيجة تحليل الـ ML لـ Observation معيّن. بمجرد التخزين، يصبح **جزءًا من الـ Audit History** للمنصة — حتى لو تغيّر الموديل لاحقًا، يمكن الرجوع لمعرفة كيف رأى الموديل القديم هذا الحدث.

### الأعمدة

| العمود | النوع | Required | الوصف |
|--------|------|----------|-------|
| `id` | UUID v7 | ✅ | Primary Key |
| `observation_id` | UUID (FK) | ✅ | **Unique** — علاقة One-to-One مع Observation |
| `verdict` | Enum | ✅ | `SAFE` \| `SUSPICIOUS` \| `MALICIOUS` — عمود مباشر (وليس داخل JSON) لأنه يُستخدم كثيرًا في الـ Dashboard |
| `confidence` | Decimal | ✅ | قيمة بين `0` و`1`، مثل `0.91` |
| `risk_score` | Integer | ✅ | قيمة بين `0` و`100`، مستخرجة كعمود لأغراض الـ Sorting والـ Filtering في الـ Dashboard |
| `summary` | Text | ✅ | الجملة المختصرة الموجزة للنتيجة |
| `model_version` | String | ✅ | رقم إصدار الموديل الذي أنتج هذا التحليل — مهم جدًا للرجوع التاريخي |
| `prediction_json` | JSONB | ✅ | الاستجابة الكاملة من الـ ML: Evidence, Reasons, Models, Datasets, MITRE, OWASP...إلخ |
| `analyzed_at` | Timestamp | ✅ | وقت انتهاء التحليل |
| `created_at` | Timestamp | ✅ | |
| `updated_at` | Timestamp | ✅ | |

### قرارات مهمة
- العلاقة `Observation (1) → Prediction (0..1)` — **وليست 1..1**: لحظة وصول الـ Observation تكون حالته `PENDING` بدون Prediction بعد.
- `risk_score` مفصول عن `verdict` (كلاهما موجودان) لأن الـ Dashboard يحتاج لكليهما بشكل مستقل — القيمة الرقمية للفرز، والنص للعرض السريع.

### الشكل النهائي
```text
predictions
──────────────────────────
id (UUID v7)                  PK
observation_id                 FK → observations.id, UNIQUE
verdict                        SAFE | SUSPICIOUS | MALICIOUS
confidence                     Decimal (0..1)
risk_score                     Integer (0..100)
summary
model_version
prediction_json (JSONB)
analyzed_at
created_at
updated_at
```

---

## 7. `alerts`

### الغرض
القرار التشغيلي النهائي (Business Event) الناتج عن سياسة المنصة استنادًا لنتيجة الـ Prediction. الـ Alert **ليس** Prediction — الـ Prediction تحليل، والـ Alert حدث عمل (Business Event) له Lifecycle خاص به.

### الأعمدة

| العمود | النوع | Required | الوصف |
|--------|------|----------|-------|
| `id` | UUID v7 | ✅ | Primary Key |
| `prediction_id` | UUID (FK) | ✅ | **Unique** — Prediction واحد ينتج Alert واحد كحد أقصى |
| `severity` | Enum | ✅ | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` — منفصل عن `risk_score` عمدًا، لأن المستخدم يفكر بالألوان لا بالأرقام |
| `status` | Enum | ✅ | `OPEN` \| `ACKNOWLEDGED` \| `RESOLVED` — Lifecycle تشغيلي. لا يوجد `ARCHIVED` هنا لأن الأرشفة استراتيجية تخزين وليست حالة عمل |
| `acknowledged_at` | Timestamp | ❌ Nullable | |
| `resolved_at` | Timestamp | ❌ Nullable | |
| `created_at` | Timestamp | ✅ | |
| `updated_at` | Timestamp | ✅ | |

### قرارات مهمة
- العلاقة `Prediction (1) → Alert (0..1)` — لأن نتيجة `SAFE` لن تُنتج Alert أبدًا.
- **Foreign Key ناحية الـ Prediction وليس الـ Observation مباشرة**: منطقيًا، سياسة المنصة (Platform Policy) هي من تقرر إنشاء الـ Alert بناءً على نتيجة التحليل — لكن من ناحية العلاقة في القاعدة، الـ Alert مرتبط بالـ Prediction الذي استند إليه مباشرة، وهذا يحافظ على فصل المسؤوليات.

### الشكل النهائي
```text
alerts
──────────────────────────
id (UUID v7)               PK
prediction_id                FK → predictions.id, UNIQUE
severity                     LOW | MEDIUM | HIGH | CRITICAL
status                        OPEN | ACKNOWLEDGED | RESOLVED
acknowledged_at
resolved_at
created_at
updated_at
```

---

## ملخص شجرة الجداول الكاملة

```text
companies
    │
    ├── users
    │
    └── agents
            │
            ├── api_keys
            │
            └── observations
                    │
                    └── predictions
                            │
                            └── alerts
```

> ملاحظة: `observations` مرتبط أيضًا بـ `companies` مباشرة (Denormalization متعمّد)، بالإضافة لارتباطه بـ `agents`.
