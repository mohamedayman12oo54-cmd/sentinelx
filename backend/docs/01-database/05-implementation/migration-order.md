# Migration Order

> الترتيب هنا **إلزامي** — كل Migration تعتمد على وجود الجداول قبلها. تنفيذها بترتيب مختلف سيفشل بسبب Foreign Key Constraints.

---

## 1. مبدأ الترتيب

كل Entity له Migration مستقلة (وليس Migration واحدة ضخمة تنشئ كل الجداول). الترتيب مبني على **تبعية العلاقات (Dependency Order)**:

```text
Root Entity أولاً → ثم كل ما يعتمد عليه بالتسلسل
```

---

## 2. الترتيب النهائي

| # | Migration | يعتمد على |
|---|-----------|-----------|
| 1 | `001_create_companies_table` | — (Root Entity) |
| 2 | `002_create_users_table` | `companies` |
| 3 | `003_create_agents_table` | `companies` |
| 4 | `004_create_api_keys_table` | `agents` |
| 5 | `005_create_observations_table` | `companies`, `agents` |
| 6 | `006_create_predictions_table` | `observations` |
| 7 | `007_create_alerts_table` | `predictions` |

---

## 3. شرح التبعيات بصريًا

```text
001 companies
      │
      ├── 002 users            (يعتمد على companies)
      │
      └── 003 agents            (يعتمد على companies)
              │
              ├── 004 api_keys   (يعتمد على agents)
              │
              └── 005 observations (يعتمد على companies + agents)
                      │
                      └── 006 predictions (يعتمد على observations)
                              │
                              └── 007 alerts (يعتمد على predictions)
```

---

## 4. ملاحظات تنفيذية لكل Migration

### `001_create_companies_table`
- `id` UUID v7 PK.
- `slug` UNIQUE NOT NULL.
- `status` Enum (`ACTIVE`, `SUSPENDED`).
- لا Foreign Keys (Root).

### `002_create_users_table`
- `company_id` FK → `companies.id`, `ON DELETE RESTRICT`, NOT NULL.
- `email` UNIQUE NOT NULL (Global، وليس Composite مع `company_id`).
- `role` Enum (`OWNER`, `MEMBER`).

### `003_create_agents_table`
- `company_id` FK → `companies.id`, `ON DELETE RESTRICT`, NOT NULL.
- `UNIQUE(company_id, name)` — Composite Unique.
- `status` Enum (`ACTIVE`, `ARCHIVED`).

### `004_create_api_keys_table`
- `agent_id` FK → `agents.id`, `ON DELETE RESTRICT`, NOT NULL.
- `key_hash` UNIQUE NOT NULL.
- تأكد من تفعيل `updated_at` رغم أن الجدول شبه Immutable (للاتساق فقط).

### `005_create_observations_table`
- `company_id` FK → `companies.id`, `ON DELETE RESTRICT`, NOT NULL (Denormalized — راجع [ADR-005](../decisions/adr-005-multi-tenancy.md)).
- `agent_id` FK → `agents.id`, `ON DELETE RESTRICT`, NOT NULL.
- `raw_ases_json` من نوع `JSONB` — **ليس** `JSON` العادي.
- `analysis_status` Enum (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) — تأكد من الافتراضي (`DEFAULT 'PENDING'`).

### `006_create_predictions_table`
- `observation_id` FK → `observations.id`, `ON DELETE RESTRICT`, `UNIQUE`, NOT NULL.
- `prediction_json` من نوع `JSONB`.
- `CHECK (risk_score BETWEEN 0 AND 100)`.
- `CHECK (confidence BETWEEN 0 AND 1)`.

### `007_create_alerts_table`
- `prediction_id` FK → `predictions.id`, `ON DELETE RESTRICT`, `UNIQUE`, NOT NULL.
- `severity` Enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- `status` Enum (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`) — الافتراضي `OPEN`.

---

## 5. Indexes — تُضاف في نفس Migration الخاصة بكل جدول

لا تحتاج Migrations منفصلة للـ Indexes — تُضاف مباشرة داخل Migration إنشاء كل جدول. راجع القائمة الكاملة في [`schema/indexes.md`](../schema/indexes.md).

مثال (`005_create_observations_table`):
```text
INDEX (agent_id, received_at DESC)
INDEX (company_id, received_at DESC)
INDEX (analysis_status, received_at ASC)
```

---

## 6. تحذير: لا تُغيّر الترتيب

لو احتجت إضافة جدول جديد مستقبلاً، رقمه دائمًا يكون **بعد** آخر رقم موجود (`008_...`)، حتى لو الجدول الجديد منطقيًا "أقرب" لجدول قديم. الترتيب التاريخي للـ Migrations لا يُعاد ترقيمه أبدًا في بيئة Production.
