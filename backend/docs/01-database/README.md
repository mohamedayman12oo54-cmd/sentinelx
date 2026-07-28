# SentinelX — Database Documentation

> **Status:** 🔒 **FROZEN** (V1)
> **Last Updated:** بعد إغلاق مرحلة Database Design (10 Sessions كاملة)
> **Owner:** Backend / Database Architecture Team

---

## 1. ليه الفولدر ده موجود؟

الـ Documentation دي **مش** ملخص، ومش شرح لـ SQL أو Laravel أو PostgreSQL.

هي **المصدر الرسمي الوحيد (Source of Truth)** لكل قرار اتاخد في تصميم قاعدة بيانات SentinelX.

كل جدول، كل عمود، كل Index، كل Constraint، وكل علاقة — موجودين هنا **مع سبب وجودهم**، مش بس شكلهم.

الهدف: أي مهندس (إنسان أو Claude Code) يقدر يفتح الفولدر ده، ويفهم خلال نص ساعة كل التفكير اللي أخد 10 Sessions كاملة من النقاش والتصميم.

> **إذا حصل أي تعارض بين الكود وبين هذه الوثيقة، فالوثيقة هي المرجع الصحيح — إلا إذا كان هناك تحديث موثّق رسميًا هنا.**

---

## 2. الهدف من قاعدة بيانات SentinelX

SentinelX منصة **Multi-Tenant SaaS** لإدارة ومراقبة الـ AI Agents من الناحية الأمنية:

```
Company (Tenant)
    │
    ├── Users            → البشر اللي بيراقبوا
    ├── Agents            → العميل الحقيقي للمنصة
    │      └── API Keys   → هوية الـ Agent الأمنية
    └── Observations      → الحدث الأمني الخام (ASES JSON)
            └── Prediction → رأي الـ ML في الحدث
                    └── Alert → القرار التشغيلي (Business Event)
```

القاعدة الذهبية اللي بنى عليها كل التصميم:

> **Observation = Fact. Prediction = Opinion. Alert = Business Decision.**

---

## 3. بنية الفولدر (Architecture)

```text
docs/
└── backend/
    └── database/
        │
        ├── README.md                              ← أنت هنا
        │
        ├── architecture/                           ← الفلسفة (مش الجداول)
        │   ├── database-overview.md
        │   ├── design-principles.md
        │   └── naming-conventions.md
        │
        ├── schema/                                 ← التفاصيل العملية لكل جدول
        │   ├── entities.md
        │   ├── relationships.md
        │   ├── constraints.md
        │   ├── indexes.md
        │   └── enums.md
        │
        ├── decisions/                              ← ADRs — القرارات المصيرية وسببها
        │   ├── adr-001-uuid-strategy.md
        │   ├── adr-002-soft-delete-strategy.md
        │   ├── adr-003-json-storage.md
        │   ├── adr-004-api-key-strategy.md
        │   └── adr-005-multi-tenancy.md
        │
        ├── diagrams/                                ← مخططات SVG بصرية
        │   ├── erd.svg
        │   ├── entity-relationships.svg
        │   └── observation-lifecycle.svg
        │
        └── implementation/                          ← الترجمة إلى تنفيذ فعلي
            ├── migration-order.md
            └── implementation-notes.md
```

---

## 4. ترتيب القراءة الموصى به

لو أول مرة تدخل على الـ Documentation دي، اتبع الترتيب ده:

| # | الملف | هتعرف منه إيه |
|---|-------|----------------|
| 1 | [`architecture/database-overview.md`](./architecture/database-overview.md) | القصة الكاملة — مين بيستخدم القاعدة وليه |
| 2 | [`architecture/design-principles.md`](./architecture/design-principles.md) | المبادئ اللي كل قرار اتبنى عليها |
| 3 | [`architecture/naming-conventions.md`](./architecture/naming-conventions.md) | قواعد التسمية (لازم تتحفظ قبل أي Migration) |
| 4 | [`schema/entities.md`](./schema/entities.md) | كل جدول بالتفصيل (أعمدة + غرض كل عمود) |
| 5 | [`schema/relationships.md`](./schema/relationships.md) | العلاقات، الـ Cardinality، وقواعد الحذف |
| 6 | [`schema/constraints.md`](./schema/constraints.md) | كل Constraint وسببه |
| 7 | [`schema/indexes.md`](./schema/indexes.md) | كل Index وأي Query بيخدمه |
| 8 | [`schema/enums.md`](./schema/enums.md) | كل الـ Enums بقيمها الكاملة |
| 9 | [`decisions/`](./decisions) | الخمس ADRs — القرارات المعمارية الكبرى |
| 10 | [`diagrams/`](./diagrams) | ERD + Entity Relationships + Observation Lifecycle |
| 11 | [`implementation/migration-order.md`](./implementation/migration-order.md) | الترتيب الفعلي لكتابة الـ Migrations |
| 12 | [`implementation/implementation-notes.md`](./implementation/implementation-notes.md) | ملاحظات تنفيذية لازم تتراعى في الكود |

---

## 5. حالة التصميم (Design Status)

```text
Database Design
████████████████████████████ 100%

Architecture        ✅ Frozen
Entities             ✅ Frozen (7 Entities)
Relationships        ✅ Frozen
Storage Strategy     ✅ Frozen (Hybrid: Structured + JSONB)
Constraints          ✅ Frozen
Indexes              ✅ Frozen (Query-Driven)
Migration Order      ✅ Frozen
```

> **قاعدة البيانات معتمدة (Frozen) اعتبارًا من نهاية Session 10.**
> أي تعديل بعد كده لازم يكون سببه **Business Requirement جديد** أو **نسخة منتج جديدة (V2)**، مش مجرد إعادة تفكير أو تحسين.

---

## 6. الجداول السبعة (نظرة سريعة)

| الجدول | النوع | الغرض الأساسي |
|--------|-------|----------------|
| `companies` | Structured | الـ Tenant الجذري (Root Entity) |
| `users` | Structured | البشر المنتمين لشركة (مراقبون، مش عملاء) |
| `agents` | Structured | العميل الحقيقي — Identity + Security Principal |
| `api_keys` | Structured | Credential مستقل بدورة حياة خاصة |
| `observations` | Hybrid (JSONB) | الحدث الأمني الخام — Source of Truth |
| `predictions` | Hybrid (JSONB) | رأي الـ ML في الـ Observation |
| `alerts` | Structured | القرار التشغيلي النهائي (Business Event) |

تفاصيل كل جدول موجودة بالكامل في [`schema/entities.md`](./schema/entities.md).

---

## 7. رحلة المشروع (السياق الأكبر)

```text
Business Idea → Story → Business Requirements → ASES Specification
     → ML Contract → REST API → Database Design (أنت هنا) → Implementation
```

الـ Database Design اتبنى **بعد** ما اتحدد الـ REST API، مش قبله — عشان الأعمدة والـ Indexes تكون مبنية على استخدام حقيقي (Query-Driven Design)، مش تخمين.

---

## 8. ما الذي لم نفعله عن قصد (V1 Scope)

عشان نتجنب Over Engineering، القرارات دي **اتاخدت بوعي** إنها مش هتتنفذ في V1:

```text
❌ Event Table            ❌ Roles Table
❌ Permissions Table       ❌ Audit Logs Table
❌ API Key Scopes          ❌ Webhooks
❌ Soft Deletes            ❌ Partitioning
❌ Event Sourcing          ❌ CQRS
❌ Full Text Search        ❌ JSON Indexing
❌ Read Replicas           ❌ Materialized Views
```

كل واحدة من دول اتناقشت ورفضت **لسبب محدد**، مش لأننا منعرفهاش. التفاصيل في [`decisions/`](./decisions).
