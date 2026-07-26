# ADR-002: رفض Soft Delete (`deleted_at`) لصالح Business States صريحة

| | |
|---|---|
| **الحالة** | ✅ مُعتمد (Frozen) |
| **الجلسة** | Session 3 (مبدئي) + Session 6 (تأكيد نهائي) |
| **يؤثر على** | كل الجداول — بالأخص `companies`, `agents`, `alerts` |

---

## السياق (Context)

النمط الشائع في كثير من الأنظمة هو إضافة عمود `deleted_at` (Soft Delete) في كل جدول، بحيث يظل السجل موجودًا فعليًا لكن يُستبعد من الاستعلامات العادية. تم تقييم هذا النمط لقاعدة بيانات SentinelX.

---

## القرار (Decision)

**لا يوجد عمود `deleted_at` في أي جدول عبر القاعدة بالكامل.** بدلاً منه، كل جدول يحتاج تمثيل "توقف" أو "إنهاء" يمتلك **Business State صريح** خاص به داخل عمود `status`:

```text
Company  → SUSPENDED   (بدلاً من DELETE)
Agent    → ARCHIVED     (بدلاً من DELETE)
Alert    → RESOLVED     (بدلاً من DELETE)
```

الجداول التي لا معنى فعلي لحذفها إطلاقًا (`observations`, `predictions`) لا تحتوي أي آلية حذف من أي نوع — لا Soft ولا Hard.

---

## الأسباب (Rationale)

### 1. الـ Business State موجود بالفعل
المنصة أصلًا صممت Lifecycle واضح لكل كيان يحتاج "إيقاف":

```text
Agent  → ACTIVE → ARCHIVED
Alert  → OPEN → ACKNOWLEDGED → RESOLVED
Company → ACTIVE → SUSPENDED
```

إضافة `deleted_at` فوق هذا يُنشئ **مصدرين للحقيقة (Two Sources of Truth)** حول حالة نفس السجل — هل السجل "متوقف" لأن `status = ARCHIVED`، أم لأن `deleted_at IS NOT NULL`؟ هذا تعقيد بدون قيمة مضافة.

### 2. طبيعة المنصة أمنية (Security & Audit)
SentinelX منصة Security & Audit — **التاريخ أهم من المساحة**. سواء استخدمنا Soft Delete أو لا، البيانات لن تُحذف فعليًا أبدًا من الجداول الحرجة (`observations`, `predictions`). الفارق الوحيد هو أن الحالة الحقيقية تُمثَّل بوضوح عبر `status`، وليس عبر Flag إضافي غامض المعنى.

### 3. تجنب Over Engineering
Soft Delete نمط مفيد في سياقات معينة (مثل حذف مستخدم لمحتواه بنفسه)، لكن في سياق SentinelX — حيث لا يوجد Delete من الأساس في أي Business Flow — إضافته تُدخل تعقيدًا (Query Scopes، استثناءات في كل استعلام) دون أن يخدم أي حالة استخدام فعلية.

---

## البدائل المرفوضة

| البديل | سبب الرفض |
|--------|-----------|
| `deleted_at` على كل الجداول | يخلق ازدواجية مع الـ Business States الموجودة أصلًا، ويُعقّد كل استعلام بشرط استثناء إضافي |
| Physical Delete | غير مقبول إطلاقًا في منصة Security & Audit — يفقد الدليل التاريخي بشكل نهائي |

---

## العواقب (Consequences)

- ✅ استعلامات أبسط — لا حاجة لـ `WHERE deleted_at IS NULL` في كل مكان.
- ✅ الحالة الحقيقية للسجل واضحة ومباشرة من عمود `status` نفسه.
- ✅ يتماشى مع مبدأ [Archive Instead of Delete](../architecture/design-principles.md#4-archive-instead-of-delete).
- ⚠️ يتطلب من فريق التطبيق (Backend) الالتزام الصارم بعدم تنفيذ أي `DELETE` فعلي على الجداول الحرجة — هذا القيد غير مفروض تقنيًا على مستوى القاعدة، بل هو اتفاق معماري يجب الالتزام به في طبقة الكود.
