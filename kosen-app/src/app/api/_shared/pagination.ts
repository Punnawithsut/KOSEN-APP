import { BadRequestError } from "./errors";

type PageOptions = {
  pageSize: number;
  required?: boolean;
};

export function parsePageQuery(
  searchParams: URLSearchParams,
  { pageSize, required = false }: PageOptions,
): number {
  const rawPage = searchParams.get("page");
  if (rawPage === null && required) {
    throw new BadRequestError(
      "A positive integer page query parameter is required.",
    );
  }

  const page = rawPage === null ? 1 : Number(rawPage);
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger((page - 1) * pageSize)
  ) {
    throw new BadRequestError("page must be a positive integer");
  }
  return page;
}
