# ADR-003: تخزين Observation وPrediction كـ JSONB بدلاً من التفكيك لجداول

| | |
|---|---|
| **الحالة** | ✅ مُعتمد (Frozen) |
| **الجلسة** | Session 1 (القرار الأولي) + Session 6, 7 (تأكيد نهائي) |
| **يؤثر على** | `observations.raw_ases_json`, `predictions.prediction_json` |

---

## السياق (Context)

الـ Observation (من الـ SDK) والـ Prediction (من الـ ML) كلاهما يحملان بيانات غنية ومعقدة نسبيًا: Events متتالية، Evidence، Reasons، Models، Datasets، تصنيفات MITRE/OWASP...إلخ.

كان يوجد خياران أساسيان:

1. **تفكيك كامل (Full Normalization):** كل Event وكل قطعة Evidence تصبح صفًا في جدول منفصل (`events`, `evidence`...).
2. **تخزين كوثيقة (Document Storage):** حفظ الـ JSON بالكامل كما وصل، واستخراج فقط الأعمدة اللازمة فعليًا للاستعلام.

---

## القرار (Decision)

**JSON (تحديدًا JSONB في PostgreSQL) — وليس تفكيك لجداول.**

```text
observations.raw_ases_json     → ASES JSON كامل (Source of Truth)
predictions.prediction_json    → استجابة الـ ML كاملة (Evidence, Reasons, Models...)
```

مع استخراج فقط الأعمدة التي يُستعلَم أو يُفلتَر أو يُرتَّب عليها فعليًا بشكل متكرر:

```text
observations → analysis_status, received_at, processing_started_at, processed_at
predictions   → verdict, confidence, risk_score, summary, model_version, analyzed_at
```

هذا النموذج يُسمَّى **Hybrid Data Model**، ويحكمه المبدأ:

> **Store for Query, Keep the Rest as Document.**

---

## الأسباب (Rationale)

### 1. الحفاظ على الشكل الأصلي (Source of Truth)
تفكيك ASES JSON لعشرات الصفوف في جداول Relational يفقدنا:
- ترتيب الأحداث الأصلي بدقة.
- سهولة إعادة التحليل (Re-analysis) بنفس البيانات بالضبط كما وصلت.
- الحفاظ على الشكل الأصلي كدليل (Evidence) قابل للرجوع إليه في أي تحقيق أمني.

### 2. مرونة أمام تغيّر الشكل (Schema Evolution)
شكل الـ Evidence القادم من الـ ML "ممكن يتغير مع تطور الموديل". لو قيّدنا أنفسنا بجداول Relational محكمة الشكل، أي تغيير في مخرجات الموديل سيتطلب Migration جديدة في القاعدة. الـ JSON يمتص هذا التغيير دون أي تعديل هيكلي.

### 3. لا حاجة استعلام فعلية داخل محتوى الـ JSON
لا يوجد أي Endpoint في REST API يستعلم *داخل* محتوى الـ Evidence أو الـ Events نفسها. الاستعلامات الفعلية كلها على مستوى الـ Metadata (الحالة، التاريخ، الدرجة)، وهذه استُخرجت بالفعل كأعمدة منفصلة.

### 4. هذا هو النمط المستخدم في أنظمة الـ Logging الحديثة
تخزين الحدث الكامل كوثيقة، مع استخراج الحقول القابلة للاستعلام فقط كأعمدة، هو نمط ثابت ومُختبَر في أنظمة المراقبة والأمن الحديثة.

---

## البدائل المرفوضة

| البديل | سبب الرفض |
|--------|-----------|
| جدول `events` منفصل لكل حدث داخل الـ Observation | يفقد ترتيب وسياق الأحداث الأصلي، ويعقّد الاستعلام والصيانة بدون فائدة حقيقية |
| جدول `evidence` منفصل لكل قطعة دليل في الـ Prediction | شكل الـ Evidence متغيّر مع تطور الموديل — تجميد شكله في جداول محكمة غير عملي |
| JSON عادي (وليس JSONB) | JSONB في PostgreSQL أسرع في البحث، يدعم Indexing، وأفضل في التخزين |

---

## العواقب (Consequences)

- ✅ حماية كاملة لسلامة البيانات الأصلية (Data Integrity) كدليل أمني.
- ✅ لا حاجة لـ Migration جديدة كل مرة يتغيّر فيها شكل مخرجات الـ ML.
- ✅ استعلامات الـ Dashboard سريعة لأنها تعتمد على الأعمدة المستخرجة، وليس على تفكيك JSON وقت القراءة.
- ⚠️ لا يمكن حاليًا عمل Full Text Search أو استعلام مباشر *داخل* محتوى الـ JSON (قرار واعٍ — راجع [`schema/indexes.md`](../schema/indexes.md#5-قرارات-معمارية-أوسع-حول-الأداء)) — إذا ظهرت حاجة فعلية لهذا مستقبلاً، يمكن إضافة GIN Index على أعمدة الـ JSONB دون تغيير هيكلي.
