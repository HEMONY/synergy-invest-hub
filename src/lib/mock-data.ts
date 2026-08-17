export type PropertyType = "سكني" | "تجاري" | "أرض" | "مبنى إداري";

export type Opportunity = {
  id: string;
  code: string;
  type: PropertyType;
  city: string;
  district: string;
  damage: string;
  rehabCost: number;
  durationMonths: number;
  fundingNeeded: number;
  expectedReturn: number;
  images: string[];
  status: "منشورة" | "قيد المراجعة" | "تم الربط";
};

export const opportunities: Opportunity[] = [
  {
    id: "1",
    code: "#1258",
    type: "سكني",
    city: "الرياض",
    district: "حي النرجس",
    damage: "تصدعات في الجدران والأسقف وتلف في بعض التمديدات الكهربائية والسباكة.",
    rehabCost: 250000,
    durationMonths: 6,
    fundingNeeded: 200000,
    expectedReturn: 18,
    images: [],
    status: "منشورة",
  },
  {
    id: "2",
    code: "#1263",
    type: "تجاري",
    city: "جدة",
    district: "حي الروضة",
    damage: "أضرار مياه في الطابق الأرضي وحاجة لإعادة تأهيل الواجهة التجارية بالكامل.",
    rehabCost: 480000,
    durationMonths: 9,
    fundingNeeded: 400000,
    expectedReturn: 24,
    images: [],
    status: "منشورة",
  },
  {
    id: "3",
    code: "#1271",
    type: "مبنى إداري",
    city: "الدمام",
    district: "حي الفيصلية",
    damage: "تهالك في المصاعد وأنظمة التكييف مع حاجة لتحديث الأنظمة الكهربائية.",
    rehabCost: 950000,
    durationMonths: 12,
    fundingNeeded: 750000,
    expectedReturn: 27,
    images: [],
    status: "منشورة",
  },
  {
    id: "4",
    code: "#1288",
    type: "سكني",
    city: "الرياض",
    district: "حي الملقا",
    damage: "حريق جزئي في الدور العلوي يتطلب إعادة تشطيب كاملة.",
    rehabCost: 320000,
    durationMonths: 5,
    fundingNeeded: 300000,
    expectedReturn: 16,
    images: [],
    status: "منشورة",
  },
  {
    id: "5",
    code: "#1290",
    type: "أرض",
    city: "المدينة المنورة",
    district: "حي العزيزية",
    damage: "أرض تحتاج ردم وتسوية وتأهيل بنية تحتية قبل التطوير.",
    rehabCost: 180000,
    durationMonths: 4,
    fundingNeeded: 150000,
    expectedReturn: 14,
    images: [],
    status: "منشورة",
  },
  {
    id: "6",
    code: "#1301",
    type: "تجاري",
    city: "جدة",
    district: "حي الشاطئ",
    damage: "تلف هيكلي في السقف المعلق وأعمال العزل المائي.",
    rehabCost: 620000,
    durationMonths: 8,
    fundingNeeded: 520000,
    expectedReturn: 21,
    images: [],
    status: "منشورة",
  },
];

export const projectStages = [
  "تم الرفع",
  "قيد المراجعة",
  "موافقة",
  "بحث ممول",
  "تم الربط",
  "قيد التنفيذ",
  "مكتمل",
] as const;

export type Project = {
  id: string;
  title: string;
  code: string;
  stageIndex: number;
  progress: number;
  funding: number;
  supervisor: string;
  updatedAt: string;
};

export const projects: Project[] = [
  {
    id: "p1",
    title: "تأهيل فيلا سكنية — حي النرجس",
    code: "#1258",
    stageIndex: 5,
    progress: 62,
    funding: 200000,
    supervisor: "م. خالد العتيبي",
    updatedAt: "قبل ساعتين",
  },
  {
    id: "p2",
    title: "إعادة تأهيل محل تجاري — حي الروضة",
    code: "#1263",
    stageIndex: 4,
    progress: 25,
    funding: 400000,
    supervisor: "م. سارة الحربي",
    updatedAt: "أمس",
  },
  {
    id: "p3",
    title: "تحديث مبنى إداري — حي الفيصلية",
    code: "#1271",
    stageIndex: 6,
    progress: 100,
    funding: 750000,
    supervisor: "م. فهد القحطاني",
    updatedAt: "قبل 3 أيام",
  },
];

export type Notification = {
  id: string;
  kind: "طلب" | "مشروع" | "توثيق" | "مالي";
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export const notifications: Notification[] = [
  {
    id: "n1",
    kind: "توثيق",
    title: "تم توثيق حسابك",
    body: "تمت الموافقة على مستنداتك، أصبح حسابك موثقاً ويمكنك رفع الطلبات.",
    time: "قبل 10 دقائق",
    unread: true,
  },
  {
    id: "n2",
    kind: "مشروع",
    title: "تحديث نسبة الإنجاز",
    body: "وصل مشروع العقار #1258 إلى نسبة إنجاز 62% مع صور تقدم جديدة.",
    time: "قبل ساعتين",
    unread: true,
  },
  {
    id: "n3",
    kind: "طلب",
    title: "شركة غقارية مهتمه بطلبك",
    body: "قام مستثمر موثق باختيار طلبك #1263 وجارٍ مراجعة الربط من الإدارة.",
    time: "أمس",
    unread: true,
  },
  {
    id: "n4",
    kind: "مالي",
    title: "توثيق استلام مبلغ التمويل",
    body: "تم توثيق استلام مبلغ 400,000 ر.س من الممول لدى إدارة المنصة.",
    time: "قبل 3 أيام",
    unread: false,
  },
];

export type AdminUser = {
  id: string;
  name: string;
  role: "صاحب عقار" | "مستثمر" | "مشرف" | "مدير";
  status: "موثّق" | "قيد المراجعة" | "مرفوض" | "معلّق";
  joined: string;
};

export const adminUsers: AdminUser[] = [
  { id: "u1", name: "عبدالله الشمري", role: "صاحب عقار", status: "موثّق", joined: "2026/03/12" },
  { id: "u2", name: "شركة رواد الاستثمار", role: "مستثمر", status: "قيد المراجعة", joined: "2026/05/02" },
  { id: "u3", name: "نورة الدوسري", role: "مستثمر", status: "موثّق", joined: "2026/01/28" },
  { id: "u4", name: "م. خالد العتيبي", role: "مشرف", status: "موثّق", joined: "2025/11/09" },
  { id: "u5", name: "سعد المطيري", role: "صاحب عقار", status: "مرفوض", joined: "2026/06/17" },
  { id: "u6", name: "هند العنزي", role: "صاحب عقار", status: "معلّق", joined: "2026/07/01" },
];

export const monthlyFunding = [
  { month: "يناير", value: 420 },
  { month: "فبراير", value: 610 },
  { month: "مارس", value: 540 },
  { month: "أبريل", value: 880 },
  { month: "مايو", value: 1020 },
  { month: "يونيو", value: 1340 },
];

export const formatSAR = (n: number) => `${n.toLocaleString("en-US")} ر.س`;
