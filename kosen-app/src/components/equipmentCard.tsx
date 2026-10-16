import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export interface equipmentCardProps {
  width: number;
  height: number;
  titleText: string;
  image: string;
  destination: string;
  description: string;
  extendedInfo: string;
  badgeText?: string;
}

export function EquipmentCard({
  width,
  height,
  titleText,
  image,
  destination,
  description,
  extendedInfo,
  badgeText,
}: equipmentCardProps) {
  return (
    <Link
      href={destination}
      className="group relative block overflow-hidden rounded-2xl border border-orange-subtle-2 bg-white/90 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-4 p-4 sm:p-5">
        {/* thumbnail */}
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl sm:size-20">
          <Image
            width={width ?? 100}
            height={height ?? 100}
            src={image}
            alt=""
            className="size-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-black-1 sm:text-lg">
              {titleText}
            </h3>
            {badgeText && (
              <span className="shrink-0 rounded-full bg-orange-subtle-2 px-2 py-0.5 text-[11px] font-medium text-orange-secondary">
                {badgeText}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-black-3">
            {description}
          </p>
        </div>

        <ArrowRight
          className="size-5 shrink-0 text-black-4 transition-opacity duration-300 ease-in-out group-hover:opacity-0"
          aria-hidden
        />
      </div>

      <div className="grid grid-rows-[0fr] transition-all duration-300 ease-in-out group-hover:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 border-t border-orange-subtle-2 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
            <p className="text-sm leading-6 text-black-2">{extendedInfo}</p>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-orange-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-90">
              Explore
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
