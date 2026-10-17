import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { openApiSpec } from "@/app/api/_shared/openapi";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return NextResponse.json(openApiSpec);
}