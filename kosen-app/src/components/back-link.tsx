import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: string;
  label: string;
  sticky?: boolean;
};

export function BackLink({ href, label, sticky = false }: BackLinkProps) {
  const link = (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-orange-subtle-2 bg-background px-4 text-sm font-medium text-black-2 transition-colors hover:bg-orange-subtle-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-secondary"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {label}
    </Link>
  );

  if (!sticky) return <div className="mb-3">{link}</div>;

  return (
    <div className="sticky top-0 z-40 -mt-2 mb-2 border-b border-orange-subtle-2 bg-bg-primary py-2 md:top-16">
      {link}
    </div>
  );
}
