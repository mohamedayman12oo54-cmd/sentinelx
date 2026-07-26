# Database Overview

> يجاوب على سؤال واحد: **"ليه قاعدة البيانات اتصممت بالشكل ده؟"**

---

## 1. القصة (Business Story)

قاعدة بيانات SentinelX مش نتيجة "خلينا نعمل جداول"، هي نتيجة قصة كاملة اتحددت الأول:

```text
شركة تسجل (Register Company)
        ↓
تضيف Agents
        ↓
الـ Agent يبعت Observation
        ↓
الـ ML يحلل الـ Observation
        ↓
Prediction
        ↓
لو خطر → Alert
```

كل جدول في القاعدة هو ترجمة مباشرة لخطوة في القصة دي. مفيش جدول اتضاف "لأنه ممكن يفيد بعدين" — كل جدول بيخدم خطوة حقيقية في الـ Business Flow.

---

## 2. مين بيستخدم قاعدة البيانات؟

قاعدة بيانات SentinelX مش ملك لطبقة واحدة، هي **العقد المشترك (Shared Contract)** بين كل أجزاء النظام:

| الطرف | إزاي بيتعامل مع القاعدة |
|-------|--------------------------|
| **SDK** | بيبعت Observation جديد عن طريق `POST /observations`، بيتخزن كـ `raw_ases_json` في جدول `observations` |
| **Backend (Laravel/API)** | بيقرأ ويكتب على كل الجداول الـ Structured (companies, users, agents, api_keys, alerts)، وبيدير الـ Lifecycle الكامل |
| **ML Service** | بياخد `observation.raw_ases_json`، بيحلله، وبيرجع نتيجة تتخزن كـ `prediction_json` + أعمدة مستخرجة (`verdict`, `risk_score`, `confidence`) |
| **Dashboard** | بيقرأ بس (Read-Heavy) — بيعتمد بشكل أساسي على الأعمدة الـ Structured (مش الـ JSON) للعرض والفلترة والترتيب |
| **Worker / Queue** | بيستعلم عن `observations WHERE analysis_status = 'PENDING'` عشان يبعتها للـ ML |

الفلسفة دي هي اللي حكمت قرار **"إيه اللي يتخزن كعمود وإيه اللي يفضل JSON"** — أي بيانات هيستخدمها أكتر من طرف بشكل متكرر في Query تتحول لعمود، والباقي يفضل جوه الـ JSON Document.

---

## 3. الفلسفة العليا: Business Data Model قبل Database

من أول جلسة، اتحدد إننا مش بنصمم "جداول"، إحنا بنصمم **Business Data Model** الأول، وبعدين بنحوله لقاعدة بيانات.

السؤال اللي بنسأله مش:

> "اعمل جدول Observations"

لكن:

> "إيه البيانات اللي لازم تعيش طول عمرها في النظام؟"

الإجابة طلعت **7 Entities فقط** تستحق التخزين الدائم:

```text
Company → Users → Agents → Observations → Predictions → Alerts → API Keys
```

مفيش Entity ثامنة، ومفيش جدول واحد اتضاف "علشان يكون موجود".

---

## 4. Hybrid Data Model

قاعدة بيانات SentinelX مبنية على نموذج هجين (Hybrid) بين نوعين من التخزين:

### النوع الأول — Structured (أعمدة عادية)
```text
Company · User · Agent · API Key · Alert
```
بيانات محدودة الشكل، بنستعلم عليها كتير، ومحتاجة Constraints واضحة.

### النوع الثاني — Document (JSONB)
```text
Observation → raw_ases_json
Prediction  → prediction_json
```
بيانات جاية من مصادر خارجية (SDK / ML)، شكلها ممكن يتغير مع الوقت، والقيمة الحقيقية فيها هي **الحفاظ على الشكل الأصلي الكامل**.

القاعدة الحاكمة:

> **Store for Query, Keep the Rest as Document.**
> نخزن كعمود بس اللي هنستعلم أو نفلتر أو نرتب عليه فعليًا. الباقي يفضل JSON.

تفاصيل السبب الكامل موجودة في [`decisions/adr-003-json-storage.md`](../decisions/adr-003-json-storage.md).

---

## 5. Multi-Tenancy من اليوم الأول

العميل الحقيقي لمنصة SentinelX هو **Company** مش **User**. المستخدم بيسجل شركة (`Register Company`)، مش حساب شخصي.

```text
SentinelX
   │
   ├── Microsoft
   │      ├── Ahmed, Omar (Users)
   │      └── 12 Agents
   │
   ├── Google
   │      ├── John (User)
   │      └── 30 Agents
   │
   └── Amazon
          └── ...
```

القرار ده أثر على كل شيء بعد كده: كل جدول Business تقريبًا بيحمل `company_id`، وكل Query تقريبًا بتبدأ بفلترة على الشركة. التفاصيل الكاملة في [`decisions/adr-005-multi-tenancy.md`](../decisions/adr-005-multi-tenancy.md).

---

## 6. Query-Driven Design

قاعدة البيانات اتصممت **بعد** الـ REST API مش قبله. القرار ده كان مقصود:

> إحنا استنينا نعرف الـ Endpoints فعلًا هتجيب إيه وتفلتر بإيه، قبل ما نقرر الأعمدة والـ Indexes.

النتيجة: كل عمود مستخرج من JSON (زي `risk_score`, `verdict`, `analysis_status`) وكل Index موجود، له **Query حقيقي** بيخدمه — مفيش عمود أو Index "احتياطي".

---

## 7. Security & Audit كخط أساسي

SentinelX منصة أمنية، فده انعكس في تصميم القاعدة نفسها:

- **مفيش Physical Delete** في الـ Business Flow — Archive بدل Delete.
- **API Keys وPasswords بتتخزن Hash فقط**، أبدًا Plain Text.
- **كل Observation وPrediction بتفضل موجودة للأبد** — علشان في أي وقت نقدر نرجع نشوف "الموديل القديم كان شايف الحدث ده إزاي؟".

القاعدة دي مش مجرد مكان تخزين، هي **System of Record** يمكن الرجوع له في أي تحقيق أو مراجعة مستقبلية.
