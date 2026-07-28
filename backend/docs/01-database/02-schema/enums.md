# Enums

> كل قيم الـ Enums في قاعدة بيانات SentinelX. تُخزَّن كـ **Strings واضحة بالـ UPPERCASE**، وليس أرقام — لأنها أوضح في القراءة، أسهل في الـ Debugging، ومناسبة تمامًا لحجم المشروع الحالي.
> راجع [`naming-conventions.md`](../architecture/naming-conventions.md#6-الـ-enums) لقاعدة التسمية.

---

## 1. `CompanyStatus` — جدول `companies.status`

| القيمة | الوصف |
|--------|-------|
| `ACTIVE` | الشركة نشطة وتستخدم المنصة بشكل طبيعي |
| `SUSPENDED` | الشركة موقوفة (بديل عن الحذف الفيزيائي) |

**غير مضاف عمدًا في V1:** `ARCHIVED`, `PENDING`.

---

## 2. `UserRole` — جدول `users.role`

| القيمة | الوصف |
|--------|-------|
| `OWNER` | المالك الأساسي لحساب الشركة |
| `MEMBER` | عضو عادي داخل الشركة |

**غير مضاف عمدًا في V1:** `ADMIN`, `VIEWER` — تجنبًا للـ Over Engineering قبل بناء نظام RBAC كامل لاحقًا.

---

## 3. `UserStatus` — جدول `users.status`

| القيمة | الوصف |
|--------|-------|
| `ACTIVE` | المستخدم نشط وقادر على تسجيل الدخول |
| `DISABLED` | المستخدم معطّل (بديل عن الحذف) |

---

## 4. `AgentStatus` — جدول `agents.status`

| القيمة | الوصف |
|--------|-------|
| `ACTIVE` | الـ Agent يعمل ويرسل Observations بشكل طبيعي |
| `ARCHIVED` | الـ Agent تمت أرشفته (Lifecycle الحقيقي — بديل عن الحذف) |

**غير مضاف عمدًا في V1:** `DISABLED` — لأن `ARCHIVED` يعكس Business Action حقيقي بالفعل (Archive Agent).

---

## 5. `ApiKeyStatus` — جدول `api_keys.status`

| القيمة | الوصف |
|--------|-------|
| `ACTIVE` | المفتاح فعّال ويمكن استخدامه للمصادقة |
| `REVOKED` | المفتاح مُلغى (يُحتفظ به كسجل Audit، لا يُحذف) |

**Business Rule:** مفتاح `ACTIVE` واحد فقط لكل Agent في أي وقت (على مستوى التطبيق).

---

## 6. `AnalysisStatus` — جدول `observations.analysis_status`

| القيمة | الوصف |
|--------|-------|
| `PENDING` | الـ Observation وصل ولم يبدأ تحليله بعد |
| `PROCESSING` | الـ ML يعالج الـ Observation حاليًا |
| `COMPLETED` | التحليل اكتمل بنجاح، ويوجد Prediction مرتبط |
| `FAILED` | فشل التحليل |

**الاستخدام الحرج:** الـ Worker يستعلم باستمرار عن `WHERE analysis_status = 'PENDING' ORDER BY received_at ASC` — لهذا يوجد Index مخصص لهذا العمود (راجع [`indexes.md`](./indexes.md)).

---

## 7. `Verdict` — جدول `predictions.verdict`

| القيمة | الوصف |
|--------|-------|
| `SAFE` | الحدث آمن — لن يُنشئ Alert |
| `SUSPICIOUS` | الحدث مشبوه |
| `MALICIOUS` | الحدث خبيث/ضار |

**ملاحظة أداء:** لا يوجد Index على هذا العمود عمدًا — Low Cardinality (3 قيم فقط فقط)، والفائدة من الـ Index محدودة جدًا.

---

## 8. `Severity` — جدول `alerts.severity`

| القيمة | الوصف |
|--------|-------|
| `LOW` | خطورة منخفضة |
| `MEDIUM` | خطورة متوسطة |
| `HIGH` | خطورة عالية |
| `CRITICAL` | خطورة حرجة |

**لماذا منفصل عن `risk_score` (الرقمي في Predictions)؟** لأن المستخدم يفكر بالألوان/المستويات وليس بالأرقام المجردة عند اتخاذ القرار التشغيلي.

---

## 9. `AlertStatus` — جدول `alerts.status`

| القيمة | الوصف |
|--------|-------|
| `OPEN` | التنبيه جديد ولم تتم مراجعته |
| `ACKNOWLEDGED` | تمت رؤية التنبيه، وقيد المعالجة |
| `RESOLVED` | تم حل التنبيه |

**غير مضاف عمدًا:** `ARCHIVED` — لأن الأرشفة استراتيجية تخزين وليست حالة عمل (Business State).

---

## 10. ملخص شامل لكل الـ Enums

```text
CompanyStatus     → ACTIVE, SUSPENDED
UserRole           → OWNER, MEMBER
UserStatus          → ACTIVE, DISABLED
AgentStatus          → ACTIVE, ARCHIVED
ApiKeyStatus          → ACTIVE, REVOKED
AnalysisStatus          → PENDING, PROCESSING, COMPLETED, FAILED
Verdict                   → SAFE, SUSPICIOUS, MALICIOUS
Severity                    → LOW, MEDIUM, HIGH, CRITICAL
AlertStatus                   → OPEN, ACKNOWLEDGED, RESOLVED
```
