# Constraints

> كل Constraint هنا موجود لسبب محدد وموثّق. لا يوجد Constraint "احتياطي" أو "علشان مايضرش".

---

## 1. `companies`

| Constraint | التفاصيل | السبب |
|-----------|----------|-------|
| `PRIMARY KEY` | `id` | Standard |
| `UNIQUE` | `slug` | لازم يكون فريد لاستخدامه في URLs / Subdomains مستقبلًا |
| `NOT NULL` | `name`, `slug`, `status` | حقول أساسية إلزامية |

**ملاحظة:** `name` **ليس** Unique — يمكن لشركتين أن يحملا نفس الاسم التجاري.

---

## 2. `users`

| Constraint | التفاصيل | السبب |
|-----------|----------|-------|
| `PRIMARY KEY` | `id` | Standard |
| `UNIQUE` | `email` | فريد عالميًا — مستخدم واحد = حساب واحد في V1 |
| `FOREIGN KEY` | `company_id → companies.id` (`RESTRICT`) | كل مستخدم لازم ينتمي لشركة موجودة فعليًا |
| `NOT NULL` | `company_id`, `full_name`, `email`, `password_hash`, `role`, `status` | حقول إلزامية |

---

## 3. `agents`

| Constraint | التفاصيل | السبب |
|-----------|----------|-------|
| `PRIMARY KEY` | `id` | Standard |
| `UNIQUE (Composite)` | `(company_id, name)` | اسم الـ Agent فريد **داخل نطاق الشركة فقط** — يسمح بنفس الاسم في شركات مختلفة |
| `FOREIGN KEY` | `company_id → companies.id` (`RESTRICT`) | كل Agent لازم ينتمي لشركة موجودة |
| `NOT NULL` | `company_id`, `name`, `framework`, `status` | حقول إلزامية |

---

## 4. `api_keys`

| Constraint | التفاصيل | السبب |
|-----------|----------|-------|
| `PRIMARY KEY` | `id` | Standard |
| `UNIQUE` | `key_hash` | كل Hash فريد بالضرورة (لا يمكن تكرار مفتاح) |
| `FOREIGN KEY` | `agent_id → agents.id` (`RESTRICT`) | كل مفتاح لازم يخص Agent موجود |
| `NOT NULL` | `agent_id`, `key_prefix`, `key_hash`, `status` | حقول إلزامية |

**Business Rule (Application Layer, وليس Database Constraint):** عدد المفاتيح `ACTIVE` لكل Agent يجب أن يكون ≤ 1 دائمًا. القاعدة تقنيًا تسمح بأكثر من سجل (لدعم الـ Rotation دون Downtime)، لكن التطبيق هو من يضمن الالتزام بهذه القاعدة.

---

## 5. `observations`

| Constraint | التفاصيل | السبب |
|-----------|----------|-------|
| `PRIMARY KEY` | `id` | Standard |
| `FOREIGN KEY` | `company_id → companies.id` (`RESTRICT`) | Denormalized FK لتحسين الأداء |
| `FOREIGN KEY` | `agent_id → agents.id` (`RESTRICT`) | كل Observation لازم يخص Agent موجود |
| `NOT NULL` | `company_id`, `agent_id`, `analysis_status`, `raw_ases_json`, `received_at` | حقول إلزامية — لا يمكن وجود Observation بدون JSON خام |

---

## 6. `predictions`

| Constraint | التفاصيل | السبب |
|-----------|----------|-------|
| `PRIMARY KEY` | `id` | Standard |
| `UNIQUE` | `observation_id` | يضمن علاقة **One-to-One** — Observation واحد ينتج Prediction واحد فقط في V1 |
| `FOREIGN KEY` | `observation_id → observations.id` (`RESTRICT`) | لا يمكن وجود Prediction بدون Observation أصلي |
| `CHECK` | `0 <= risk_score <= 100` | القيمة يجب أن تقع ضمن نطاق منطقي |
| `CHECK` | `0 <= confidence <= 1` | القيمة يجب أن تقع ضمن نطاق منطقي |
| `NOT NULL` | `observation_id`, `verdict`, `confidence`, `risk_score`, `summary`, `model_version`, `prediction_json`, `analyzed_at` | حقول إلزامية |

---

## 7. `alerts`

| Constraint | التفاصيل | السبب |
|-----------|----------|-------|
| `PRIMARY KEY` | `id` | Standard |
| `UNIQUE` | `prediction_id` | يضمن أن Prediction واحد ينتج Alert واحد كحد أقصى |
| `FOREIGN KEY` | `prediction_id → predictions.id` (`RESTRICT`) | لا يمكن وجود Alert بدون Prediction أصلي |
| `CHECK` | `severity IN ('LOW','MEDIUM','HIGH','CRITICAL')` | يضمن الالتزام بقيم الـ Enum |
| `CHECK` | `status IN ('OPEN','ACKNOWLEDGED','RESOLVED')` | يضمن الالتزام بقيم الـ Enum |
| `NOT NULL` | `prediction_id`, `severity`, `status` | حقول إلزامية |

---

## 8. سياسة الحذف الموحدة (تنطبق على كل الجداول)

```text
ON DELETE RESTRICT   ← في كل Foreign Key بدون استثناء
```

لا يوجد `CASCADE` ولا `SET NULL` في أي علاقة عبر القاعدة كلها. راجع الشرح الكامل في [`relationships.md`](./relationships.md#4-سياسة-الحذف-delete-strategy).

---

## 9. قاعدة عامة للـ Uniqueness

> **Unique فقط عند الحاجة الفعلية — مش كل حاجة تستحق تبقى Unique.**

| الحقل | Unique؟ | السبب |
|-------|---------|-------|
| `companies.name` | ❌ لا | شركتين يمكن أن يحملا نفس الاسم التجاري |
| `companies.slug` | ✅ نعم | يُستخدم في URLs |
| `users.email` | ✅ نعم (عالمي) | مستخدم واحد = حساب واحد |
| `agents.name` | ✅ نعم (داخل الشركة فقط — Composite) | يمنع تكرار اسم Agent داخل نفس الشركة |
| `api_keys.key_hash` | ✅ نعم | فريد بالتصميم (نتيجة Hashing) |
| `predictions.observation_id` | ✅ نعم | يفرض العلاقة 1:1 |
| `alerts.prediction_id` | ✅ نعم | يفرض حد أقصى Alert واحد لكل Prediction |
