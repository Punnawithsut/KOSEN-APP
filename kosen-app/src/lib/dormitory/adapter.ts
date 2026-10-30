import {
  FORM_ICON_KEYS,
  type DormForm,
  type DormHandbook,
  type DormRule,
  type DormStaff,
  type OfficeHour,
  type StaffPosition,
  type Weekday,
} from "./data";

type Raw = Record<string, unknown>;
const asRaw = (value: unknown): Raw => value as Raw;
const weekdays: Record<string, Weekday> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};
const positions: Record<string, StaffPosition> = {
  lecturer: "lecturer",
  educator: "educator",
  "dormitory staff": "dormitory_staff",
  dormitory_staff: "dormitory_staff",
};
const iconFor = (name: string): DormForm["icon"] =>
  /maintenance|repair/i.test(name)
    ? "maintenance"
    : /transfer|payment/i.test(name)
      ? "transfer"
      : /water|meter/i.test(name)
        ? "meter"
        : "document";
const dateLabel = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export function adaptDormData(raw: {
  wardens: unknown[];
  forms: unknown[];
  rules: unknown[];
  handbook: unknown | null;
}) {
  const staffById = new Map<string, DormStaff>();
  for (const item of raw.wardens ?? []) {
    const w = asRaw(item);
    const hours: OfficeHour = {
      recordId: String(w.id),
      day: weekdays[String(w.officeDay).toLowerCase()] ?? "Mon",
      start: String(w.officeStartTime).slice(0, 5),
      end: String(w.officeEndTime).slice(0, 5),
    };
    const name = String(w.name ?? "");
    const existing = staffById.get(name);
    if (existing) existing.officeHours.push(hours);
    else
      staffById.set(name, {
        id: String(w.id),
        name,
        nickname: name,
        position: positions[String(w.role).toLowerCase()] ?? "educator",
        officeHours: [hours],
        phone: String(w.phone ?? ""),
        lineId: String(w.lineID ?? ""),
        photo: typeof w.photoUrl === "string" ? w.photoUrl : null,
      });
  }
  const forms: DormForm[] = (raw.forms ?? []).map((item) => {
    const f = asRaw(item);
    const name = String(f.name ?? "");
    return {
      id: String(f.id),
      title: name,
      description: String(f.description ?? ""),
      url: String(f.formsURL ?? ""),
      closesAt: f.dueDate ? new Date(String(f.dueDate)).toISOString() : null,
      icon:
        typeof f.icon === "string" &&
        FORM_ICON_KEYS.includes(f.icon as (typeof FORM_ICON_KEYS)[number])
          ? (f.icon as DormForm["icon"])
          : iconFor(name),
    };
  });
  const rules: DormRule[] = (raw.rules ?? []).map((item) => {
    const r = asRaw(item);
    return {
      id: String(r.id),
      title: String(r.name ?? ""),
      body: [r.rule_description, r.penalty_description]
        .filter(
          (value): value is string =>
            typeof value === "string" && Boolean(value),
        )
        .join("\n\nPenalty: "),
      updatedAt: dateLabel(r.updatedAt),
    };
  });
  const book = raw.handbook ? asRaw(raw.handbook) : null;
  const handbook: DormHandbook = book
    ? {
        title: String(book.title),
        edition: String(book.edition),
        pages: Number(book.pages),
        updatedAt: dateLabel(book.updatedAt),
        fileName: String(book.fileName),
        pdfUrl: String(book.pdfUrl),
      }
    : {
        title: "Dormitory Handbook",
        edition: "",
        pages: 0,
        updatedAt: "—",
        fileName: null,
        pdfUrl: null,
      };
  return { staff: [...staffById.values()], forms, rules, handbook };
}
