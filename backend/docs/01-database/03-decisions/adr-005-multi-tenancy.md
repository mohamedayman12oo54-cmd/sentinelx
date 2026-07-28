# ADR-005: Multi-Tenancy عبر `company_id`، بما في ذلك تكراره داخل `observations`

| | |
|---|---|
| **الحالة** | ✅ مُعتمد (Frozen) |
| **الجلسة** | Session 4 (القرار الأساسي) + Session 6 (تأكيد Denormalization) |
| **يؤثر على** | كل الجداول Business تقريبًا، وبالأخص `observations.company_id` |

---

## السياق (Context)

من اليوم الأول، تحدد أن العميل يسجّل عبر "Register Company"، وليس "Register User". هذا يجعل SentinelX منصة **Multi-Tenant SaaS** بطبيعتها، حيث Company هو الـ Tenant الجذري:

```text
SentinelX
   │
   ├── Microsoft (Tenant)
   │      ├── Ahmed, Omar (Users)
   │      └── 12 Agents
   │
   ├── Google (Tenant)
   │      ├── John (User)
   │      └── 30 Agents
```

---

## القرار (Decision)

### الجزء الأول: Company هو الـ Root Entity
كل كيان Business تقريبًا يحمل `company_id` مباشرة أو بشكل غير مباشر:

```text
Company
    │
    ├── Users            (company_id مباشر)
    ├── Agents            (company_id مباشر)
    │      └── API Keys   (عبر agent_id → agents.company_id)
    └── Observations      (company_id مباشر + agent_id)
            └── Predictions (عبر observation_id)
                    └── Alerts (عبر prediction_id)
```

### الجزء الثاني: Denormalization متعمّد في `observations`
رغم أن `company_id` يمكن استنتاجه من `agent_id → agents.company_id`، تقرر تكرار `company_id` **مباشرة** داخل جدول `observations`.

---

## الأسباب (Rationale)

### لماذا Company هو الجذر وليس User؟
العميل الحقيقي للمنصة هو الشركة، والمستخدم مجرد شخص "ينتمي" لها (`User belongs to Company`)، وليس العكس. هذا القرار المعماري يؤثر على تصميم كل العلاقات في القاعدة — كل Query تقريبًا تبدأ منطقيًا بفلترة `company_id`.

### لماذا تكرار `company_id` في `observations` (Denormalization)؟
هذا القرار قد يبدو مخالفًا لمبادئ الـ Normalization الأكاديمية للوهلة الأولى، لكنه محسوب بدقة:

- **تقريبًا كل استعلام في الـ Dashboard يبدأ بـ `company_id`** — هذا هو نمط الاستخدام الفعلي والمتكرر للمنصة.
- **يُعفي من `JOIN` مع جدول `agents`** في أغلب عمليات القراءة، خصوصًا الاستعلامات عالية التكرار مثل `GET /observations`.
- **يعزل الـ Observation عن أي تغييرات مستقبلية على بيانات الـ Agent** (مثل نقل Agent بين شركات نظريًا — رغم عدم دعمه حاليًا، العزل يحمي من هذا السيناريو).
- **يجعل الاستعلامات الأساسية أسرع وأبسط** بشكل مباشر وملموس.

القاعدة التي حكمت هذا القرار:

> **Normalize by default... Denormalize only when it clearly improves real business queries.**

هذا ليس تضحية بالنقاء الأكاديمي، بل **Production Engineering** حقيقي مبني على طريقة استخدام المنصة الفعلية.

---

## البدائل المرفوضة

| البديل | سبب الرفض |
|--------|-----------|
| الاعتماد فقط على `agent_id` واستنتاج الشركة عبر JOIN | يبطئ الاستعلامات الأكثر تكرارًا في المنصة (Dashboard queries)، ويزيد التعقيد في كل استعلام |
| جعل User هو الـ Tenant الجذري بدلاً من Company | يخالف طبيعة المنتج الفعلية — التسجيل من الأساس هو "Register Company" |
| نظام Multi-Tenancy عبر قواعد بيانات منفصلة لكل Tenant (Database-per-Tenant) | تعقيد تشغيلي غير مبرر لحجم المشروع الحالي (V1) — Over Engineering |

---

## العواقب (Consequences)

- ✅ كل استعلام Dashboard رئيسي يعمل بأداء عالٍ دون الحاجة لـ JOIN متكرر.
- ✅ عزل منطقي بين بيانات كل Company، يسهّل تطبيق قواعد الأمان (Row-Level Security مستقبلاً إن لزم).
- ✅ الأساس المعماري جاهز لأي تطور مستقبلي في نظام الصلاحيات (RBAC) أو الفوترة (Billing per Tenant).
- ⚠️ **مسؤولية إضافية على طبقة التطبيق:** أي عملية إنشاء لـ Observation يجب أن تضمن تطابق `company_id` مع `agent.company_id` فعليًا — القاعدة لا تفرض هذا التطابق تلقائيًا عبر Constraint (لا يوجد Composite Foreign Key يربط الاثنين معًا في V1).
