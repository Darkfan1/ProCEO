# PROCEO — DATABASE & DATA MODEL SCHEMA

Hệ thống lưu trữ ProCEO sử dụng cấu trúc tài liệu chuẩn (Document Store) kết hợp Firestore và LocalStorage Mirror.

## 1. Danh Mục Các Thực Thể Quản Trị (Entities)

### A. Strategy & Strategic Alignment
1. **`SWOTAnalysis` / `SwotBoard`** (`axis_ceo_swot`):
   - `id`: string
   - `title`: string
   - `period`: string (VD: "2026 - 2027")
   - `focusDomain`: string
   - `entries`: Array<{ id, type: 'S'|'W'|'O'|'T', content: string, impact: 'HIGH'|'MEDIUM' }>
   - `towsActions`: Array<{ id, strategyType: 'SO'|'WO'|'ST'|'WT', actionTitle, ownerName, dueDate, status: 'PLANNED'|'EXECUTING'|'DONE' }>
   - `updatedAt`: ISOString

2. **`OkrObjective`** (`axis_ceo_okrs`):
   - `id`: string
   - `quarter`: string (VD: "Q4/2026")
   - `title`: string
   - `department`: string
   - `ownerName`: string
   - `priority`: 'P0' | 'P1' | 'P2'
   - `keyResults`: Array<{ id, title, startValue: number, targetValue: number, currentValue: number, unit: string, linkedErpMetric?: string }>
   - `createdAt`: ISOString

### B. Goal & Continuous Improvement
3. **`SmartTask` / `SMARTGoal`** (`axis_ceo_tasks`):
   - `id`: string
   - `title`: string
   - `department`: string
   - `domain`: 'PRODUCTION'|'SALES'|'FINANCE'|'QUALITY'|'HR'|'SUPPLY_CHAIN'|'MANAGEMENT'
   - `assigneeName`: string
   - `dueDate`: YYYY-MM-DD
   - `dueTime`: HH:mm
   - `priority`: 'URGENT'|'HIGH'|'MEDIUM'|'LOW'
   - `status`: 'TODO'|'IN_PROGRESS'|'REVIEW'|'DONE'
   - `progress`: 0-100
   - `smart`: { specific, measurable, achievable, relevant, timeBound }
   - `smartScore`: 0-100
   - `linkedLsxCode`?: string
   - `linkedOkrId`?: string
   - `followUpCount`: number
   - `createdAt`: ISOString

4. **`PdcaCycle`** (`axis_ceo_pdca`):
   - `id`: string
   - `title`: string
   - `area`: 'PRODUCTION'|'QUALITY'|'DELIVERY'|'HR_CULTURE'|'COST_CONTROL'|'MANAGEMENT'
   - `ownerName`: string
   - `phase`: 'PLAN'|'DO'|'CHECK'|'ACT'|'STANDARDIZED'
   - `planProblem`: string (Vấn đề & nguyên nhân gốc rễ 5-Why)
   - `doExperiment`: string (Giải pháp thực thi thử nghiệm)
   - `checkEvaluation`: string (Đo lường kiểm tra thực tế)
   - `actStandardize`: string (Chuẩn hóa quy trình SOP hoặc lặp mới)
   - `metricBaseline`: string
   - `metricTarget`: string
   - `metricActual`: string
   - `dueDate`: YYYY-MM-DD
   - `iteration`: number
   - `linkedSmartTaskId`?: string
   - `sopStandardizedTitle`?: string
   - `sopStandardizedCode`?: string
   - `evaluationSummary`?: string
   - `evaluationStatus`?: 'PENDING'|'ACHIEVED'|'ADJUST_NEXT_ITERATION'
   - `createdAt`: ISOString

### C. Execution, Meetings & Communication
5. **`ScheduleItem`** (`axis_ceo_schedules`):
   - `id`: string
   - `title`: string
   - `startTime`, `endTime`, `date`
   - `repeat`: 'ONCE'|'DAILY'|'WEEKDAYS'|'WEEKLY'
   - `category`: 'MEETING_369'|'ERP_REVIEW'|'STRATEGY_OKR'|'COACHING_MASLOW'|'DEEP_WORK'|'PERSONAL'
   - `completedDates`: string[]
   - `createdAt`: ISOString

6. **`Meeting369`** (`axis_ceo_meetings`):
   - `id`: string
   - `title`: string
   - `topic`: string
   - `objective`: string
   - `date`: YYYY-MM-DD
   - `startTime`: HH:mm
   - `durationMinutes`: number
   - `chairperson`: string
   - `participants`: string[]
   - `preReadDocs`: string
   - `meetingRules`: string
   - `agendaFlow`: string[]
   - `decisionsSummary`: string
   - `sixStepsCompleted`: boolean[] (6 bước)
   - `ninePrinciplesChecked`: boolean[] (9 nguyên tắc)
   - `actionItems`: Array<{ id, taskTitle, assigneeName, dueDate, status, supervisedCount }>
   - `linkedPdcaId`?: string
   - `linkedSmartTaskId`?: string
   - `createdAt`: ISOString

7. **`PrepMessage`** (`axis_ceo_prep_docs`):
   - `id`: string
   - `title`: string
   - `audience`: string
   - `category`: 'DIRECTIVE'|'ALIGNMENT'|'POLICY'|'MOTIVATION'
   - `pointOpening`: string (P1: Luận điểm chính mở đầu)
   - `reasonWhy`: string (R: Lý do vì sao)
   - `exampleEvidence`: string (E: Dẫn chứng / Ví dụ thực tế)
   - `pointClosing`: string (P2: Khẳng định lại và hành động kế tiếp)
   - `createdAt`: ISOString

### D. People & Motivation
8. **`MaslowEmployeePlan`** (`axis_ceo_coaching`):
   - `id`: string
   - `employeeName`: string
   - `department`: string
   - `role`: string
   - `dominantNeedLevel`: 1|2|3|4|5 (Tháp 5 tầng)
   - `satisfactionScores`: { level1, level2, level3, level4, level5 }
   - `currentObservation`: string
   - `motivationAction`: string
   - `nextCheckInDate`: YYYY-MM-DD
   - `createdAt`: ISOString

9. **`FfcPraiseRecord`** (`axis_ceo_praises`):
   - `id`: string
   - `recipientName`: string
   - `department`: string
   - `feeling`: string (F1: Cảm xúc chân thành của lãnh đạo)
   - `fact`: string (F2: Sự thật / hành vi / con số thực tế)
   - `compare`: string (C: So sánh với chính họ trước đây)
   - `sentToErp`: boolean
   - `createdAt`: ISOString
