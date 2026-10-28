/**
 * Static dormitory content. Swap these for an API later; the UI only depends on
 * the shapes below.
 */

export type DormHandbook = {
  title: string;
  edition: string;
  pages: number;
  updatedAt: string;
  /** Public path to the PDF, e.g. "/dormitory/handbook.pdf". `null` = not uploaded yet. */
  pdfUrl: string | null;
};

export type DormRule = {
  id: string;
  title: string;
  updatedAt: string;
  /** Rule text shown when the rule is opened. */
  body: string;
  /** Optional attached PDF shown under the text. `null` = no attachment. */
  fileUrl: string | null;
};

export type DormForm = {
  id: string;
  title: string;
  description: string;
  icon: "maintenance" | "transfer" | "meter";
  /** Google Forms link, opened in a new tab. `null` = not published yet. */
  url: string | null;
  /** ISO date; `null` = no due date. */
  closesAt: string | null;
};

export type DormStaff = {
  id: string;
  name: string;
  role: string;
  officeHours: string[];
  phone: string;
  lineId: string;
  /** Public path to a photo. `null` shows a placeholder. */
  photo: string | null;
};

export const HANDBOOK: DormHandbook = {
  title: "Dormitory Handbook",
  edition: "2026/27 edition",
  pages: 42,
  updatedAt: "Aug 18, 2026",
  pdfUrl: null,
};

export const RULES: DormRule[] = [
  {
    id: "gate-curfew",
    title: "Gate curfew",
    updatedAt: "Jun 29, 2026",
    body: "Placeholder: the dormitory gate closes at the curfew time. Residents who return late must inform the staff in advance.",
    fileUrl: null,
  },
  {
    id: "contact-hours",
    title: "Contact hours",
    updatedAt: "Jun 29, 2026",
    body: "Placeholder: staff can be reached during their office hours. Outside those hours, use the emergency contact.",
    fileUrl: null,
  },
  {
    id: "general",
    title: "General conduct",
    updatedAt: "Jun 29, 2026",
    body: "Placeholder: keep shared spaces clean, keep noise down at night and respect other residents.",
    fileUrl: null,
  },
];

export const FORMS: DormForm[] = [
  {
    id: "maintenance",
    title: "Maintenance Request",
    description: "Report a broken facility in your room",
    icon: "maintenance",
    url: "https://docs.google.com/forms", // TODO: replace with the real form link
    closesAt: null,
  },
  {
    id: "transfer-slip",
    title: "Transfer Slip Submit",
    description: "Submit your dormitory fee payment slip",
    icon: "transfer",
    url: "https://docs.google.com/forms", // TODO: replace with the real form link
    closesAt: null,
  },
  {
    id: "water-meter",
    title: "Water Meter Submit",
    description: "Submit this month's water meter reading",
    icon: "meter",
    url: "https://docs.google.com/forms", // TODO: replace with the real form link
    // Demo value so the "Closes in N days" badge is visible; replace with the real deadline.
    closesAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
  },
];

export const STAFF: DormStaff[] = [
  {
    id: "som",
    name: "P’Som",
    role: "Educator",
    officeHours: ["Tue, 13.00-22.00", "Wed, 08.00-12.00"],
    phone: "0xx-xxx-xxxx",
    lineId: "0xx-xxx-xxxx",
    photo: null,
  },
  {
    id: "james",
    name: "P’James",
    role: "Educator",
    officeHours: ["Tue, 13.00-22.00", "Wed, 08.00-12.00"],
    phone: "0xx-xxx-xxxx",
    lineId: "0xx-xxx-xxxx",
    photo: null,
  },
  {
    id: "a",
    name: "P’A",
    role: "Educator",
    officeHours: ["Tue, 13.00-22.00", "Wed, 08.00-12.00"],
    phone: "0xx-xxx-xxxx",
    lineId: "0xx-xxx-xxxx",
    photo: null,
  },
];
