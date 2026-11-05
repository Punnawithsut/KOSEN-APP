import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: string;
  label: string;
  sticky?: boolean;
};

export function BackLink({ href, label, sticky = true }: BackLinkProps) {
  const link = (
    <Link
      href={href}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-orange-primary text-white transition-colors hover:bg-orange-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-secondary"
    >
      <ArrowLeft aria-hidden className="size-5" />
    </Link>
  );

  if (!sticky) return <div className="mb-3">{link}</div>;

  return (
    <div className="sticky top-0 z-40 -mt-2 mb-2 bg-bg-primary py-2 md:top-16">
      {link}
    </div>
  );
}
