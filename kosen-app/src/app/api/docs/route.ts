import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

export async function GET() {
  // Hide in production
  if (process.env.NODE_ENV === "production") {
    notFound(); // Triggers a 404 response
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>KOSEN API Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/api/docs/spec',
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
