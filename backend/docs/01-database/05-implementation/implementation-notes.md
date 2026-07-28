# Implementation Notes

> ملاحظات عملية مباشرة يجب مراعاتها أثناء كتابة الـ Migrations والـ Models. هذا الملف تحديدًا موجّه لأي أداة أو مهندس ينفّذ الكود فعليًا (بما في ذلك Claude Code).

---

## 1. قواعد عامة إلزامية

```text
✔ استخدم UUID v7 لكل id  (وليس Auto Increment، وليس UUID v4)
✔ استخدم JSONB (وليس JSON) للأعمدة: raw_ases_json, prediction_json
✔ لا تستخدم CASCADE في أي Foreign Key
✔ لا تستخدم SET NULL في أي Foreign Key
✔ استخدم RESTRICT في كل Foreign Key بدون استثناء
✔ لا تُضف عمود deleted_at في أي جدول
✔ Hash فقط لـ: api_keys.key_hash و users.password_hash — لا تخزين Plain Text أبدًا
✔ كل الجداول (شامل api_keys) تحتوي created_at و updated_at
```

---

## 2. Database Engine

**PostgreSQL** هو المُوصى به والمُعتمد للتصميم بالكامل، خصوصًا بسبب:
- دعم `JSONB` الأصلي (أداء وفهرسة أفضل من `JSON` العادي).
- دعم ممتاز لـ `UUID` كنوع بيانات أصلي.
- نضج ودعم واسع لـ Composite Indexes.

---

## 3. Naming — لا استثناءات

راجع [`architecture/naming-conventions.md`](../architecture/naming-conventions.md) بالكامل قبل كتابة أي Migration. أهم النقاط:

- الجداول: جمع + `snake_case` (`companies`, `observations`).
- الأعمدة: `snake_case`.
- Foreign Keys: `<entity>_id` دائمًا.
- Timestamps: تنتهي بـ `_at` دائمًا.
- Enum Values: `UPPERCASE` Strings دائمًا (وليس أرقام).

---

## 4. Business Rules غير مفروضة على مستوى الـ Database — يجب تطبيقها في الكود

بعض القواعد التجارية **لا تُفرض تلقائيًا** عبر Constraints في القاعدة، ويجب تطبيقها صراحة في طبقة التطبيق (Backend):

| القاعدة | أين تُطبَّق |
|---------|-------------|
| مفتاح `ACTIVE` واحد فقط لكل Agent في `api_keys` | Application Layer — عند إنشاء مفتاح جديد، يجب تعطيل القديم أولًا ضمن نفس Transaction |
| تطابق `observations.company_id` مع `agents.company_id` الخاص بنفس الـ Observation | Application Layer — عند إدخال Observation جديد، اجلب `company_id` من الـ Agent نفسه، لا تعتمد على قيمة خارجية مُرسَلة |

---

## 5. الأعمدة المستخرجة من JSON — لا تُكرر المصدر يدويًا

الأعمدة زي `verdict`, `risk_score`, `confidence`, `summary`, `model_version` في `predictions` هي **نسخة مستخرجة** من `prediction_json` لأغراض الاستعلام السريع. عند إدخال Prediction جديد:

```text
1. خزّن الاستجابة الكاملة من الـ ML في prediction_json
2. استخرج منها القيم المطلوبة وضعها في الأعمدة المخصصة
3. تأكد أن القيم متطابقة دائمًا (لا تسمح بتباعد بين الاثنين)
```

نفس المبدأ لا ينطبق حرفيًا على `observations` لأن كل أعمدتها (عدا JSON) هي Metadata خاصة بدورة حياة السجل نفسه (`analysis_status`, `received_at`...) وليست مستخرجة من محتوى JSON.

---

## 6. Migrations — تسلسل التنفيذ الإلزامي

راجع [`implementation/migration-order.md`](./migration-order.md) للترتيب الكامل. تنفيذ الترتيب الخاطئ سيؤدي لفشل فوري بسبب Foreign Key Constraints.

---

## 7. ما لا يجب تنفيذه في V1 (تذكير)

هذه القرارات **مقصودة**، وليست نقصًا في المعرفة. لا تُضِف أي مما يلي إلا إذا كان هناك Business Requirement موثّق جديد يستدعي ذلك رسميًا:

```text
❌ Event Table                ❌ Roles Table
❌ Permissions Table            ❌ Audit Logs Table
❌ API Key Scopes                ❌ Webhooks
❌ Soft Deletes (deleted_at)      ❌ Partitioning
❌ Event Sourcing                  ❌ CQRS
❌ Full Text Search                  ❌ JSON GIN Indexing
❌ Read Replicas                      ❌ Materialized Views
```

---

## 8. الـ Redis Cache — ملاحظة مهمة

يوجد استخدام واحد فقط مسموح به لـ Redis في V1: **Dashboard Statistics**. هذا **ليس** جزءًا من تصميم قاعدة البيانات نفسها (لا Migration، لا Schema)، بل طبقة Cache منفصلة تمامًا فوق طبقة الاستعلام العادية. لا تعتمد عليه كمصدر حقيقة (Source of Truth) لأي بيانات.

---

## 9. قائمة تحقق سريعة قبل أي Pull Request على الـ Schema

```text
[ ] كل Primary Key هو UUID v7؟
[ ] كل Foreign Key يستخدم ON DELETE RESTRICT؟
[ ] كل Timestamp ينتهي بـ _at؟
[ ] كل Enum يستخدم UPPERCASE Strings؟
[ ] كل عمود JSON من نوع JSONB؟
[ ] لا يوجد عمود deleted_at؟
[ ] الـ Index الجديد (لو موجود) مربوط بـ Query حقيقي وموثّق في schema/indexes.md؟
[ ] القرار موثّق في الملف المناسب (entities.md / relationships.md / ADR جديد لو قرار معماري كبير)؟
```
