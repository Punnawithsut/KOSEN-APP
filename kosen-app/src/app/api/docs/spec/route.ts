import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { openApiSpec } from "@/app/api/_shared/openapi";

export async function GET() {
  // Hide in production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return NextResponse.json(openApiSpec);
}