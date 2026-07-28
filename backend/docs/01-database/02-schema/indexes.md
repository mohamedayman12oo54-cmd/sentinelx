# Indexes

> المبدأ الحاكم: **Every Index Must Pay for Itself.**
> مفيش Index موجود "لأن ممكن يفيد" — كل Index هنا مربوط بـ Query حقيقي من الـ REST API أو الـ Worker.
> هذا التصميم مبني على **Access Patterns** (أنماط الاستخدام الفعلية) وليس على شكل البيانات فقط.

---

## 1. منهجية بناء القائمة

بدل النظر للجداول وسؤال "أي عمود يستحق Index؟"، تم النظر إلى الـ REST API endpoints الفعلية وسؤال: **"إيه الـ Queries اللي المنصة هتنفذها كل يوم؟"** ثم صُمم Index لكل Query حقيقي فقط.

---

## 2. القائمة النهائية للـ Indexes حسب الجدول

### `companies`
```text
PRIMARY KEY (id)
UNIQUE      (slug)
```

### `users`
```text
PRIMARY KEY (id)
UNIQUE      (email)
INDEX       (company_id)
```

### `agents`
```text
PRIMARY KEY (id)
UNIQUE      (company_id, name)
INDEX       (company_id, created_at DESC)
```

### `api_keys`
```text
PRIMARY KEY (id)
UNIQUE      (key_hash)
INDEX       (agent_id)
INDEX       (key_hash, status)
```

### `observations`
```text
PRIMARY KEY (id)
INDEX       (agent_id, received_at DESC)
INDEX       (company_id, received_at DESC)
INDEX       (analysis_status, received_at ASC)
```

### `predictions`
```text
PRIMARY KEY (id)
UNIQUE      (observation_id)
```

### `alerts`
```text
PRIMARY KEY (id)
UNIQUE      (prediction_id)
INDEX       (status, created_at DESC)
```

---

## 3. تفصيل كل Index والـ Query الذي يخدمه

### Index 1 — `agents(company_id, created_at DESC)`
**يخدم:**
```http
GET /api/v1/agents
```
```sql
SELECT * FROM agents
WHERE company_id = ?
ORDER BY created_at DESC;
```
**لماذا Composite؟** لأننا نفلتر على `company_id` ثم نرتب بـ `created_at` — Composite Index واحد يجعل PostgreSQL ينفذ الفلترة والترتيب بعملية واحدة بدل Filter ثم Sort منفصلين.

---

### Index 2 — `observations(agent_id, received_at DESC)`
**يخدم:**
```http
GET /api/v1/agents/{id}/observations
```
```sql
SELECT * FROM observations
WHERE agent_id = ?
ORDER BY received_at DESC
LIMIT 20;
```

---

### Index 3 — `observations(company_id, received_at DESC)`
**يخدم:**
```http
GET /api/v1/observations
```
```sql
SELECT * FROM observations
WHERE company_id = ?
ORDER BY received_at DESC;
```

---

### Index 4 — `alerts(status, created_at DESC)`
**يخدم:** Dashboard — آخر الـ Alerts المفتوحة.
```sql
SELECT * FROM alerts
WHERE status = 'OPEN'
ORDER BY created_at DESC
LIMIT 10;
```
**لماذا Composite بدل Index على `status` فقط؟** لأن الترتيب جزء أساسي من الـ Query نفسه، والـ Composite يخدم الاثنين معًا بكفاءة أعلى.

---

### Index 5 — `observations(analysis_status, received_at ASC)`
**يخدم:** الـ Worker — أهم Query في الـ Backend كله.
```sql
SELECT * FROM observations
WHERE analysis_status = 'PENDING'
ORDER BY received_at ASC
LIMIT 1;
```

---

### Index 6 — `users(email)` (Unique)
**يخدم:** Login.
```sql
SELECT * FROM users WHERE email = ?;
```

---

### Index 7 — `api_keys(key_hash, status)`
**يخدم:** SDK Authentication.
```sql
SELECT * FROM api_keys
WHERE key_hash = ? AND status = 'ACTIVE';
```
**لماذا مع أن `key_hash` أصلًا Unique؟** وجود `status` ضمن الـ Index يجعل تنفيذ الاستعلام أوضح وأسرع، خصوصًا لو احتُفظ بمفاتيح قديمة (`REVOKED`) في نفس الجدول، مع بقاء `key_hash` نفسه فريدًا دائمًا.

---

## 4. Queries تم النظر فيها ورُفض عمل Index لها (بوعي)

| Query | القرار | السبب |
|-------|--------|-------|
| `predictions ORDER BY risk_score DESC LIMIT 10` (Dashboard) | ❌ لا Index | الـ Dashboard غالبًا يعرض هذه البيانات عبر `alerts`، وليس عبر استعراض كل الـ Predictions مباشرة. يُضاف لاحقًا فقط إذا ظهرت الحاجة الفعلية |
| `agents WHERE status = ?` | ❌ لا Index | لا يوجد Endpoint يفلتر بالـ Status حاليًا |
| `agents WHERE framework = ?` | ❌ لا Index | لا يوجد Endpoint يفلتر بالـ Framework في V1 |
| `predictions WHERE verdict = ?` | ❌ لا Index | Low Cardinality (3 قيم فقط) — الفائدة من الـ Index محدودة جدًا |
| `predictions ORDER BY analyzed_at` | ❌ لا Index | لا يوجد Query حقيقي يعتمد عليه |

---

## 5. قرارات معمارية أوسع حول الأداء

| السؤال | القرار | السبب |
|--------|--------|-------|
| Full Text Search؟ | ❌ لا | لا يوجد Search Endpoint في V1 |
| JSON Indexing (على `raw_ases_json` / `prediction_json`)؟ | ❌ لا | لا يوجد استعلام مباشر داخل محتوى الـ JSON — يُخزَّن كوثيقة كاملة فقط |
| Partitioning؟ | ❌ لا (V1) | يزيد تعقيد الإدارة والصيانة، ولن يقدم فائدة حقيقية قبل الوصول لعشرات/مئات الملايين من السجلات |
| Read Replicas؟ | ❌ لا | المنصة لا تزال SaaS صغير الحجم |
| Materialized Views؟ | ❌ لا | الـ Dashboard الحالي بسيط بما يكفي للاستعلام المباشر |
| Redis Cache؟ | ✅ نعم، لكن لجزء واحد فقط | إحصائيات الـ Dashboard (Dashboard Statistics) فقط — وليس جزءًا من تصميم قاعدة البيانات نفسها |

---

## 6. المبدأ الختامي

> إحنا بنصمم الـ Database بناءً على أنماط الاستخدام (Access Patterns)، وليس بناءً على شكل البيانات فقط.

هذا يحمينا من مشكلتين متعاكستين:
- **قلة الـ Indexes** → استعلامات بطيئة.
- **كثرة الـ Indexes** → بطء في الإدخال والتحديث، واستهلاك مساحة تخزين بدون فائدة حقيقية.
