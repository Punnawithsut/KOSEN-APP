export const ITEM_TYPES = ["calculator", "charger"] as const;
export const UNIT_STATUSES = ["available", "out", "repair", "lost"] as const;
export const SLOT_KINDS = ["normal", "exam"] as const;
export const LOAN_STATUSES = ["pending", "approved", "delivered", "returned", "overdue", "cancelled", "rejected", "expired", "no_show"] as const;

export type ItemType = (typeof ITEM_TYPES)[number];
export type UnitStatus = (typeof UNIT_STATUSES)[number];
export type SlotKind = (typeof SLOT_KINDS)[number];
export type LoanStatus = (typeof LOAN_STATUSES)[number];
