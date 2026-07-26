# Design Principles

> ده الملف اللي أي مهندس جديد (أو Claude Code) لازم يقرأه الأول قبل ما يلمس أي Migration.
> كل قرار في `schema/` و`decisions/` هو **تطبيق مباشر** لمبدأ من المبادئ دي.

---

## 1. Observation is Immutable

الـ Observation بمجرد ما يتخزن، **بيتقفل**. مفيش تعديل عليه بعد كده أبدًا.

**ليه؟** لأنه Fact — حدث أمني حصل فعلًا. لو عدّلناه، بنفقد مصداقيته كـ Audit Record.

**التطبيق:** مفيش `UPDATE` على `raw_ases_json` بعد الإدخال الأول. الأعمدة الوحيدة اللي بتتحدث بعد الإنشاء هي أعمدة الـ Lifecycle نفسها (`analysis_status`, `processing_started_at`, `processed_at`).

---

## 2. Prediction is Derived

الـ Prediction مش بيانات أصلية، هو **نتيجة تحليل** مبني على Observation في لحظة معينة.

**ليه؟** لأن الموديل نفسه ممكن يتغير مع الوقت. لو رجعنا نحلل نفس الـ Observation بموديل جديد، النتيجة هتختلف — وده متوقع ومقبول، مش تناقض.

**التطبيق:** كل Prediction بيحمل `model_version` — عشان بعد سنة نقدر نعرف "الموديل القديم كان شايف الحدث ده إزاي؟". Prediction برضه Immutable بعد التحليل.

---

## 3. Alert is Business State

الـ Alert مش تحليل، هو **قرار تشغيلي (Business Event)** ناتج عن سياسة المنصة (Platform Policy) بناءً على نتيجة الـ Prediction.

**ليه؟** لأن فصل "التحليل" عن "القرار" بيدينا مرونة — ممكن نغير سياسة إنشاء الـ Alerts (مثلاً نرفع الحد الأدنى لـ risk_score) من غير ما نلمس منطق الـ ML خالص.

**التطبيق:** `alerts` جدول منفصل، له Lifecycle خاص بيه (`OPEN → ACKNOWLEDGED → RESOLVED`) مختلف تمامًا عن حالة الـ Prediction.

---

## 4. Archive Instead of Delete

مفيش Physical Delete في أي Business Flow.

**ليه؟** SentinelX منصة Security & Audit — التاريخ أهم من المساحة. حذف بيانات فيزيائيًا معناه فقدان دليل ممكن يتحتاج في تحقيق مستقبلي.

**التطبيق:**
```text
Company  → SUSPENDED  (مش DELETE)
Agent    → ARCHIVED    (مش DELETE)
Alert    → RESOLVED    (مش DELETE)
```
مفيش عمود `deleted_at` في أي جدول. راجع [`decisions/adr-002-soft-delete-strategy.md`](../decisions/adr-002-soft-delete-strategy.md).

---

## 5. UUID Everywhere

كل Primary Key في النظام هو `UUID v7`. مفيش Auto Increment Integer في أي جدول.

**ليه؟** المنصة Public-Facing، ومينفعش حد يقدر يخمن IDs (`/company/1`, `/company/2`...). الـ v7 بالتحديد لأنه مرتب زمنيًا وأسرع في الـ Indexing من v4.

راجع [`decisions/adr-001-uuid-strategy.md`](../decisions/adr-001-uuid-strategy.md).

---

## 6. JSON as Source of Truth (حيث يلزم)

البيانات الجاية من مصادر خارجية متغيرة الشكل (SDK, ML) بتتخزن كـ **JSONB كامل**، مش مفككة لجداول.

**ليه؟** لأن تفكيك الـ ASES JSON أو الـ ML Evidence لجداول relational هيفقدنا:
- ترتيب الأحداث الأصلي.
- سهولة إعادة التحليل.
- الشكل الأصلي اللي ممكن نحتاجه كدليل.

**التطبيق:** `observations.raw_ases_json` و`predictions.prediction_json` فقط هما JSONB. مفيش جدول ثالث بـ JSON. راجع [`decisions/adr-003-json-storage.md`](../decisions/adr-003-json-storage.md).

---

## 7. Indexes Follow Access Patterns

مفيش Index بيتضاف "لأنه ممكن يفيد"، كل Index بيخدم **Query حقيقي** موجود فعليًا في الـ REST API.

**القاعدة:** *Every Index Must Pay for Itself.*

**التطبيق:** كل Index موثّق في [`schema/indexes.md`](../schema/indexes.md) مع الـ Query المحدد اللي بيخدمه. مفيش Index بدون سبب مكتوب.

---

## 8. No Over Engineering

القرار الأصعب مش "نضيف إيه"، هو "نرفض نضيف إيه دلوقتي".

**التطبيق العملي:** القرارات دي اتاخدت بوعي كامل واتأجلت لـ V2 أو أكتر:

```text
❌ Event Table              ❌ Roles / Permissions Tables
❌ Audit Logs Table          ❌ API Key Scopes
❌ Webhooks                  ❌ Soft Deletes (deleted_at)
❌ Partitioning               ❌ Event Sourcing / CQRS
❌ Full Text Search           ❌ JSON Indexing
❌ Read Replicas              ❌ Materialized Views
```

كل واحدة من دول ليها سبب رفض محدد وليس غياب معرفة — التفاصيل في [`decisions/`](../decisions) وملاحظات [`implementation/implementation-notes.md`](../implementation/implementation-notes.md).

---

## 9. Normalize by Default, Denormalize with Purpose

القاعدة العامة: Normalize. لكن لو فيه Denormalization بيحسّن Query حقيقي ومتكرر بشكل واضح، بنعمله بوعي.

**مثال حقيقي:** `observations.company_id` موجود رغم إنه ممكن يُستنتج من `agent_id → agents.company_id`. القرار ده اتاخد لأن كل Query تقريبًا في الـ Dashboard بيبدأ بـ `company_id`، وتجنب الـ JOIN المتكرر بيحسّن الأداء بشكل ملموس.

**القاعدة الكاملة:**
> Normalize by default... Denormalize only when it clearly improves real business queries.

---

## 10. Parent Must Always Exist (Referential Integrity)

أي Record في النظام لازم يكون له Parent صالح. مفيش Foreign Key بـ `NULL` إلا في الحالات اللي اتفقنا عليها منطقيًا (زي وجود Prediction من عدمه).

**التطبيق:**
```text
Observation.agent_id       → لازم Agent موجود
Prediction.observation_id  → لازم Observation موجود
Alert.prediction_id        → لازم Prediction موجود
```
كل الـ Foreign Keys تستخدم `ON DELETE RESTRICT` — مفيش `CASCADE` ومفيش `SET NULL` في أي علاقة Business. راجع [`schema/relationships.md`](../schema/relationships.md).
