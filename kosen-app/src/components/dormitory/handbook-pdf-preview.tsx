"use client";

import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import { Button } from "@/components/ui/button";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PDF_OPTIONS = {
  disableRange: true,
  disableStream: true,
};

class PdfErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Handbook PDF preview failed to render:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function PreviewError({ url }: { url: string }) {
  return (
    <div
      role="alert"
      className="flex min-h-0 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center"
    >
      <p className="font-medium text-black-2">
        The PDF preview could not be loaded.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-primary px-4 text-sm font-semibold text-white"
      >
        Open PDF
        <ExternalLinkIcon className="size-4" />
      </a>
    </div>
  );
}

export default function HandbookPdfPreview({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(720);
  const [scale, setScale] = useState(1);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    function updatePageWidth() {
      setPageWidth(Math.min(800, Math.max(240, window.innerWidth - 64)));
    }

    updatePageWidth();
    window.addEventListener("resize", updatePageWidth);
    return () => window.removeEventListener("resize", updatePageWidth);
  }, []);

  function handleLoadError(error: Error) {
    console.error("Unable to load handbook PDF preview:", error);
    setLoadError(true);
  }

  const errorFallback = <PreviewError url={url} />;

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-2">
      {loadError ? (
        errorFallback
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((page) => page - 1)}
              >
                <ChevronLeftIcon />
              </Button>
              <span className="min-w-20 text-center text-xs text-black-3">
                {numPages ? `${pageNumber} / ${numPages}` : "Loading"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!numPages || pageNumber >= numPages}
                onClick={() => setPageNumber((page) => page + 1)}
              >
                <ChevronRightIcon />
              </Button>
              <span className="mx-1 h-5 border-l" aria-hidden />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Zoom out"
                disabled={scale <= 0.8}
                onClick={() => setScale((value) => Math.max(0.8, value - 0.2))}
              >
                <ZoomOutIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Zoom in"
                disabled={scale >= 2}
                onClick={() => setScale((value) => Math.min(2, value + 0.2))}
              >
                <ZoomInIcon />
              </Button>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-black-2 hover:bg-black-6"
            >
              Open PDF
              <ExternalLinkIcon className="size-4" />
            </a>
          </div>

          <div className="min-h-0 min-w-0 w-full flex-1 overflow-auto rounded-lg border bg-black-6 p-2">
            <div className="mx-auto w-max min-w-full py-2">
              <PdfErrorBoundary fallback={errorFallback}>
                <Suspense
                  fallback={
                    <p className="p-6 text-center text-sm text-black-3">
                      Loading PDF…
                    </p>
                  }
                >
                  <Document
                    file={url}
                    options={PDF_OPTIONS}
                    className="w-max min-w-full"
                    onLoadSuccess={({ numPages: totalPages }) => {
                      setNumPages(totalPages);
                      setPageNumber(1);
                    }}
                    onLoadError={handleLoadError}
                    onSourceError={handleLoadError}
                    loading={
                      <p className="p-6 text-center text-sm text-black-3">
                        Loading PDF…
                      </p>
                    }
                    error={errorFallback}
                  >
                    {numPages ? (
                      <Page
                        key={pageNumber}
                        pageNumber={pageNumber}
                        width={pageWidth}
                        scale={scale}
                        className="mx-auto shadow-md"
                        renderTextLayer
                        renderAnnotationLayer
                        onLoadError={handleLoadError}
                      />
                    ) : null}
                  </Document>
                </Suspense>
              </PdfErrorBoundary>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
