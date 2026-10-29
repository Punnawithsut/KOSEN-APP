import { BadRequestError } from "../_shared/errors";
import { findUserIdByFilters } from "./user.repo";

const DEPARTMENTS = [
  "Computer Engineering",
  "Mechatronics Engineering",
  "Electrical and Electronics Engineering",
] as const;

const DORM_BUILDINGS = ["7", "8"] as const;

export type UserFilters = {
  department?: (typeof DEPARTMENTS)[number];
  year?: number;
  dormBuilding?: (typeof DORM_BUILDINGS)[number];
  dormRoom?: string;
};

function getOptionalQueryValue(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const value = searchParams.get(key)?.trim();
  return value || undefined;
}

export function parseListQuery(searchParams: URLSearchParams): UserFilters {
  const department = getOptionalQueryValue(searchParams, "department");
  const selectedDepartment = DEPARTMENTS.find((value) => value === department);
  if (department && !selectedDepartment) {
    throw new BadRequestError(
      `Department must be one of: ${DEPARTMENTS.join(", ")}`,
    );
  }

  const yearValue = getOptionalQueryValue(searchParams, "year");
  const year =
    yearValue === undefined
      ? undefined
      : /^[1-5]$/.test(yearValue)
        ? Number(yearValue)
        : Number.NaN;
  if (
    year !== undefined &&
    (!Number.isInteger(year) || year < 1 || year > 5)
  ) {
    throw new BadRequestError("Year must be an integer between 1 and 5.");
  }

  const dormBuilding = getOptionalQueryValue(searchParams, "dormBuilding");
  const selectedDormBuilding = DORM_BUILDINGS.find(
    (value) => value === dormBuilding,
  );
  if (dormBuilding && !selectedDormBuilding) {
    throw new BadRequestError("Dorm building must be either 7 or 8.");
  }

  const dormRoom = getOptionalQueryValue(searchParams, "dormRoom");
  if (dormRoom && dormRoom.length > 50) {
    throw new BadRequestError("Dorm room must be 50 characters or fewer.");
  }

  return {
    department: selectedDepartment,
    year,
    dormBuilding: selectedDormBuilding,
    dormRoom,
  };
}

export async function listUsers(filters: UserFilters) {
  return findUserIdByFilters(filters);
}
