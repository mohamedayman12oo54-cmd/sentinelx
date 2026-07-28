# Relationships & Foreign Keys

> كل علاقة هنا هي قرار **Frozen**. أي تغيير في الـ Cardinality أو الـ Delete Rule يعتبر تغيير معماري، ولازم يُوثَّق كـ ADR جديد.

---

## 1. خريطة العلاقات الكاملة

```text
Company
│
├──── Users              (1 → ∞)
│
├──── Agents             (1 → ∞)
│      │
│      └──── API Keys    (1 → ∞)
│
└──── Observations       (1 → ∞)   ← Denormalized FK
        │
        └──── Predictions (1 → 0..1)
                │
                └──── Alerts (1 → 0..1)
```

---

## 2. جدول العلاقات التفصيلي

| # | العلاقة | Cardinality | Foreign Key | Delete Rule |
|---|---------|-------------|--------------|-------------|
| 1 | Company → Users | 1 → ∞ | `users.company_id → companies.id` | `RESTRICT` |
| 2 | Company → Agents | 1 → ∞ | `agents.company_id → companies.id` | `RESTRICT` |
| 3 | Agent → API Keys | 1 → ∞ | `api_keys.agent_id → agents.id` | `RESTRICT` |
| 4 | Agent → Observations | 1 → ∞ | `observations.agent_id → agents.id` | `RESTRICT` |
| 5 | Company → Observations | 1 → ∞ | `observations.company_id → companies.id` | `RESTRICT` |
| 6 | Observation → Prediction | 1 → 0..1 | `predictions.observation_id → observations.id` (UNIQUE) | `RESTRICT` |
| 7 | Prediction → Alert | 1 → 0..1 | `alerts.prediction_id → predictions.id` (UNIQUE) | `RESTRICT` |

---

## 3. شرح كل علاقة

### Company → Users
```text
Company (1) ──── Users (∞)
```
الشركة الواحدة فيها أكثر من مستخدم، والمستخدم ينتمي لشركة واحدة فقط. حذف شركة وعندها مستخدمون يعتبر **خطأ منطقي (Business Error)**، لذلك `RESTRICT`.

### Company → Agents
```text
Company (1) ──── Agents (∞)
```
نفس المنطق تمامًا — لا يمكن حذف شركة طالما لديها Agents مرتبطة.

### Agent → API Keys
```text
Agent (1) ──── API Keys (∞)
```
العلاقة **One-to-Many وليست One-to-One** عمدًا، لدعم الـ Key Rotation والاحتفاظ بالمفاتيح القديمة كسجل Audit (`REVOKED`).

**Business Rule (على مستوى التطبيق، وليس القاعدة):** عدد المفاتيح بحالة `ACTIVE` لكل Agent ≤ 1 في أي وقت.

### Agent → Observations
```text
Agent (1) ──── Observations (∞)
```
كل Observation لازم يكون له Agent (لا يوجد Observation "يتيم"). الـ Agent لا يُحذَف فعليًا (Archive فقط)، لذا `RESTRICT` منطقي بالكامل.

### Company → Observations (Denormalized)
```text
Company (1) ──── Observations (∞)
```
رغم أن الشركة يمكن استنتاجها عبر `agent_id → agents.company_id`، تم تكرار `company_id` مباشرة داخل `observations` **لتحسين الأداء** — راجع الشرح الكامل في [`entities.md`](./entities.md#5-observations) وقسم الـ Denormalization في [`design-principles.md`](../architecture/design-principles.md#9-normalize-by-default-denormalize-with-purpose).

### Observation → Prediction
```text
Observation (1) ──── Prediction (0..1)
```
**ليست 1..1** — عند وصول الـ Observation لأول مرة تكون حالته `PENDING` بدون Prediction بعد. فقط بعد اكتمال تحليل الـ ML يظهر الـ Prediction المرتبط. الـ Constraint `UNIQUE(observation_id)` يضمن عدم وجود أكثر من Prediction واحد لكل Observation في V1.

### Prediction → Alert
```text
Prediction (1) ──── Alert (0..1)
```
**Optional** لأن نتيجة `SAFE` لن تُنتج Alert أبدًا. الـ Constraint `UNIQUE(prediction_id)` يضمن Alert واحد كحد أقصى لكل Prediction.

---

## 4. سياسة الحذف (Delete Strategy)

### القرار: `RESTRICT` في كل مكان — بلا استثناء

```text
✔ ON DELETE RESTRICT  (في كل الـ Foreign Keys)
✘ لا يوجد CASCADE
✘ لا يوجد SET NULL
```

### لماذا لا CASCADE؟

لو استخدمنا `CASCADE`، أي حذف خاطئ لسجل Company سيؤدي لحذف تسلسلي لكل شيء تحته:

```text
Company → Users → Agents → API Keys → Observations → Predictions → Alerts
```

بمعنى فقدان كامل تاريخ الشركة نتيجة خطأ واحد (Bug أو حذف بشري). في منصة أمنية، هذا كارثي. المنصة أصلًا تعتمد على **Archive** وليس **Delete**، فلا فائدة عملية من الـ Cascade أبدًا.

### لماذا لا SET NULL؟

`SET NULL` يعني السماح بوجود سجلات "يتيمة" — مثل Observation بدون Agent، أو Alert بدون Prediction. هذا مرفوض تمامًا لأنه يخالف مبدأ [Parent Must Always Exist](../architecture/design-principles.md#10-parent-must-always-exist-referential-integrity).

### لماذا لا Soft Delete (`deleted_at`)؟

المنصة لديها بالفعل Lifecycle واضح ومُعبِّر عن الحالة الفعلية للبيانات:

```text
Company → SUSPENDED
Agent   → ARCHIVED
Alert   → RESOLVED
```

إضافة عمود `deleted_at` فوق ده هتدخل تعقيد إضافي بدون قيمة حقيقية. راجع [`decisions/adr-002-soft-delete-strategy.md`](../decisions/adr-002-soft-delete-strategy.md) للتفاصيل الكاملة.

---

## 5. Referential Integrity — القاعدة الذهبية

> **أي Record في النظام لازم يكون له Parent صالح.**

```text
✘ Observation.agent_id       = NULL   → ممنوع
✘ Prediction.observation_id  = NULL   → ممنوع
✘ Alert.prediction_id        = NULL   → ممنوع
```

كل العلاقات إلزامية (Mandatory) إلا ما اتفقنا عليه منطقيًا كـ Optional (وجود Prediction أو Alert من عدمه) — لكن **لو السجل موجود، فالـ Parent لازم يكون موجود دائمًا**.

---

## 6. لماذا الأصل هو Denormalization محسوب وليس Normalization الأكاديمي الصرف؟

القرار المتكرر عبر القاعدة كلها:

> Normalize by default... Denormalize only when it clearly improves real business queries.

المثال الوحيد الفعلي لهذا في V1 هو `observations.company_id`. لا يوجد أي تكرار آخر في باقي الجداول — كل الحالات الأخرى Normalized بالكامل.
