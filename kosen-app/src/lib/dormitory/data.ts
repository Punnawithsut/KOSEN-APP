/**
 * Static dormitory content. Swap these for an API later; the UI only depends on
 * the shapes below.
 */

export type DormAttachment = {
  id: string;
  name: string;
  /** MIME type, e.g. "image/png" or "application/pdf". */
  type: string;
  url: string;
};

export type DormHandbook = {
  title: string;
  edition: string;
  pages: number;
  updatedAt: string;
  /** Original name of the uploaded file. */
  fileName: string | null;
  /** Public path or object URL of the PDF. `null` = not uploaded yet. */
  pdfUrl: string | null;
};

export type DormRule = {
  id: string;
  title: string;
  updatedAt: string;
  /** Rule text shown when the rule is opened. May be empty if there are attachments. */
  body: string;
  /** Optional attached images, PDFs or other files. */
  attachments: DormAttachment[];
};

export type FormIconKey =
  | "maintenance"
  | "transfer"
  | "meter"
  | "document"
  | "calendar"
  | "wifi"
  | "key"
  | "bed"
  | "help"
  | "mail"
  | "phone"
  | "meal"
  | "laundry"
  | "clothes"
  | "transport"
  | "parcel"
  | "safety"
  | "wallet"
  | "electricity"
  | "water"
  | "group"
  | "home"
  | "checklist"
  | "announce"
  | "health"
  | "luggage"
  | "night"
  | "fee"
  | "warning";

export type DormForm = {
  id: string;
  title: string;
  description: string;
  icon: FormIconKey;
  /** Google Forms link, opened in a new tab. */
  url: string;
  /** ISO date; `null` = no due date. */
  closesAt: string | null;
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type OfficeHour = {
  day: Weekday;
  /** "HH:MM", 24h. */
  start: string;
  end: string;
};

/** Listed most to least senior; the staff list is sorted in this order. */
export const STAFF_POSITIONS = {
  lecturer: "Lecturer",
  educator: "Educator",
  dormitory_staff: "Dormitory staff",
} as const;
export type StaffPosition = keyof typeof STAFF_POSITIONS;

export type DormStaff = {
  id: string;
  name: string;
  nickname: string;
  position: StaffPosition;
  officeHours: OfficeHour[];
  phone: string;
  lineId: string;
  /** Public path or object URL of a photo. `null` shows a placeholder. */
  photo: string | null;
};

export const HANDBOOK: DormHandbook = {
  title: "Dormitory Handbook",
  edition: "2026/27 edition",
  pages: 42,
  updatedAt: "Aug 18, 2026",
  fileName: null,
  pdfUrl: null,
};

export const RULES: DormRule[] = [
  {
    id: "gate-curfew",
    title: "Gate curfew",
    updatedAt: "Jun 29, 2026",
    body: "Placeholder: the dormitory gate closes at the curfew time. Residents who return late must inform the staff in advance.",
    attachments: [],
  },
  {
    id: "contact-hours",
    title: "Contact hours",
    updatedAt: "Jun 29, 2026",
    body: "Placeholder: staff can be reached during their office hours. Outside those hours, use the emergency contact.",
    attachments: [],
  },
  {
    id: "general",
    title: "General conduct",
    updatedAt: "Jun 29, 2026",
    body: "Placeholder: keep shared spaces clean, keep noise down at night and respect other residents.",
    attachments: [],
  },
];

export const FORMS: DormForm[] = [
  {
    id: "maintenance",
    title: "Maintenance Request",
    description: "Report a broken facility in your room",
    icon: "maintenance",
    url: "https://docs.google.com/forms/placeholder-maintenance", // TODO: replace with the real form link
    closesAt: null,
  },
  {
    id: "transfer-slip",
    title: "Transfer Slip Submit",
    description: "Submit your dormitory fee payment slip",
    icon: "transfer",
    url: "https://docs.google.com/forms/placeholder-transfer", // TODO: replace with the real form link
    closesAt: null,
  },
  {
    id: "water-meter",
    title: "Water Meter Submit",
    description: "Submit this month's water meter reading",
    icon: "meter",
    url: "https://docs.google.com/forms/placeholder-water-meter", // TODO: replace with the real form link
    // Demo value so the "Closes in N days" badge is visible; replace with the real deadline.
    closesAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
  },
];

const SAMPLE_HOURS: OfficeHour[] = [
  { day: "Tue", start: "13:00", end: "22:00" },
  { day: "Wed", start: "08:00", end: "12:00" },
];

export const STAFF: DormStaff[] = ["Som", "James", "A"].map((nickname) => ({
  id: nickname.toLowerCase(),
  name: `P’${nickname}`,
  nickname,
  position: "educator" as const,
  officeHours: SAMPLE_HOURS,
  phone: "0xx-xxx-xxxx",
  lineId: "0xx-xxx-xxxx",
  photo: null,
}));
