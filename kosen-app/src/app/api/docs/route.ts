import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <title>KOSEN API Reference</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/api/docs/spec"
          data-configuration='{"theme": "purple"}'></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}