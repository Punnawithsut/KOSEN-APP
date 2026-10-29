export type ItemType = "calculator" | "charger";
export type UnitStatus = "available" | "out" | "repair" | "lost";
export type LoanStatus =
  | "pending"
  | "approved"
  | "delivered"
  | "returned"
  | "overdue"
  | "cancelled"
  | "rejected"
  | "expired"
  | "no_show";
export type SlotKind = "normal" | "exam";

export type PagedData<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Unit = {
  id: string;
  code: string;
  itemType: ItemType;
  status: UnitStatus;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UnitFilters = {
  itemType?: ItemType;
  status?: UnitStatus;
  isActive?: boolean;
  search?: string;
  page?: number;
};

export type CreateUnitData = {
  code: string;
  itemType: ItemType;
  note?: string;
};

export type UpdateUnitData = {
  code?: string;
  itemType?: ItemType;
  note?: string;
  isActive?: boolean;
};

export type Slot = {
  id: string;
  kind: SlotKind;
  startTime: string;
  endTime: string;
  leadMin: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SlotFilters = {
  kind?: SlotKind;
  isActive?: boolean;
  page?: number;
};

export type CreateSlotData = Pick<Slot, "kind" | "startTime" | "endTime"> & {
  leadMin?: number;
  displayOrder?: number;
  isActive?: boolean;
};
export type UpdateSlotData = Partial<CreateSlotData>;

export type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  midtermStartDate: string | null;
  midtermEndDate: string | null;
  finalExamStartDate: string | null;
  finalExamEndDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type TermExamDates = Pick<
  Term,
  | "midtermStartDate"
  | "midtermEndDate"
  | "finalExamStartDate"
  | "finalExamEndDate"
>;

export type CreateTermData = Pick<Term, "name" | "startDate" | "endDate"> &
  Partial<TermExamDates>;
export type UpdateTermData = Partial<CreateTermData>;

export type LoanRecord = {
  id: string;
  borrowerId: string;
  itemType: ItemType;
  unitId: string;
  termId: string;
  slotId: string;
  slotDate: string;
  status: LoanStatus;
  requestedAt: string;
  returnNote?: string | null;
  rejectReason: string | null;
  cancelReason: string | null;
  unit: Unit;
  slot: Slot;
  term: Term;
  approver?: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  borrower?: {
    userId: string;
    studentId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    department: string | null;
    year: number | null;
  };
};

export type LoanFilters = {
  status?: LoanStatus;
  itemType?: ItemType;
  slotDate?: string;
  slotId?: string;
  unitSearch?: string;
  borrowerId?: string;
  searchName?: string;
  mine?: boolean;
  page?: number;
};

export type CreateLoanData = {
  unitId: string;
  itemType?: ItemType;
  termId: string;
  slotId: string;
  slotDate: string;
  returnNote: string | null;
};

export type UpdateLoanData = {
  termId?: string;
  slotId?: string;
  slotDate?: string;
  returnNote?: string | null;
};

export function queryString(
  values: Record<string, string | number | boolean | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
