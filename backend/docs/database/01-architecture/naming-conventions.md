# Naming Conventions

> قواعد التسمية دي **Frozen** ولازم تتطبق بدون استثناء على أي جدول أو Migration جديدة.

---

## 1. أسماء الجداول (Tables)

- **صيغة الجمع دائمًا (Plural).**
- `snake_case`.

```text
companies
users
agents
api_keys
observations
predictions
alerts
```

❌ ممنوع: `company`, `Company`, `tblCompany`, `companyList`

---

## 2. أسماء الأعمدة (Columns)

- `snake_case` دائمًا.

```text
agent_name
risk_score
created_at
company_id
```

❌ ممنوع: `AgentName`, `riskScore`, `CompanyID`

---

## 3. المفاتيح الأساسية (Primary Keys)

كل جدول له عمود `id` من نوع `UUID v7`.

```text
id UUID PRIMARY KEY
```

راجع [`decisions/adr-001-uuid-strategy.md`](../decisions/adr-001-uuid-strategy.md) للسبب الكامل.

---

## 4. المفاتيح الأجنبية (Foreign Keys)

الصيغة دائمًا: `<singular_entity_name>_id`

```text
company_id      → companies.id
agent_id        → agents.id
observation_id  → observations.id
prediction_id   → predictions.id
```

بدون استثناء — حتى لو الجدول اللي بيتم الإشارة له اسمه مختلف عن الـ Entity.

---

## 5. الطوابع الزمنية (Timestamps)

كل جدول (بدون استثناء، شامل `api_keys`) لازم يحتوي:

```text
created_at
updated_at
```

بالإضافة لطوابع زمنية خاصة بالـ Domain عند الحاجة، وكلها بتنتهي بـ `_at`:

| الجدول | الأعمدة الإضافية |
|--------|-------------------|
| `observations` | `received_at`, `processing_started_at`, `processed_at` |
| `predictions` | `analyzed_at` |
| `alerts` | `acknowledged_at`, `resolved_at` |
| `agents` | `last_seen_at` |
| `api_keys` | `last_used_at`, `expires_at` |
| `users` | `last_login_at` |

**القاعدة:** أي عمود بيمثل "وقت حدوث حاجة" لازم اسمه ينتهي بـ `_at`. لا استثناءات.

---

## 6. الـ Enums

القيم بتتخزن كـ **Strings واضحة بالحروف الكبيرة (UPPERCASE)**، مش أرقام.

```text
ACTIVE, ARCHIVED, SUSPENDED, PENDING, OPEN, RESOLVED
```

**ليه Strings مش Integers؟** أوضح في القراءة، أسهل في الـ Debugging، ومفيش حاجة اسمها "إيه معنى الرقم 3 في status؟".

القائمة الكاملة لكل الـ Enums في [`schema/enums.md`](../schema/enums.md).

---

## 7. أعمدة الـ JSON

الاسم دايمًا بيوضح المحتوى + بيلاحقه `_json`:

```text
raw_ases_json
prediction_json
```

النوع دائمًا `JSONB` (PostgreSQL)، مش `JSON` العادي — لأداء أفضل في البحث والفهرسة.

---

## 8. أسماء الـ Unique / Composite Constraints

بيتم التعبير عنها بالشكل:

```text
UNIQUE(column)
UNIQUE(column_a, column_b)   -- Composite
```

مثال:
```text
UNIQUE(slug)                     -- companies
UNIQUE(email)                    -- users
UNIQUE(company_id, name)         -- agents (Composite)
UNIQUE(key_hash)                 -- api_keys
UNIQUE(observation_id)           -- predictions
UNIQUE(prediction_id)            -- alerts
```

---

## 9. أسماء الـ Migrations

كل Entity له Migration مستقلة، مرقمة بالترتيب الصحيح للتبعية (Dependency Order):

```text
001_create_companies_table
002_create_users_table
003_create_agents_table
004_create_api_keys_table
005_create_observations_table
006_create_predictions_table
007_create_alerts_table
```

راجع [`implementation/migration-order.md`](../implementation/migration-order.md) للتفاصيل الكاملة.

---

## 10. ملخص سريع (Cheat Sheet)

| العنصر | القاعدة | مثال |
|--------|---------|------|
| اسم الجدول | جمع + snake_case | `observations` |
| اسم العمود | snake_case | `risk_score` |
| Primary Key | `id` (UUID v7) | `id` |
| Foreign Key | `<entity>_id` | `agent_id` |
| Timestamp | ينتهي بـ `_at` | `received_at` |
| Enum Value | UPPERCASE String | `ACTIVE` |
| JSON Column | `<name>_json` (JSONB) | `raw_ases_json` |
| Migration | مرقمة حسب التبعية | `005_create_observations_table` |
