"use client";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrgLogoUrl } from "@/utils/org.util";
import { useLandingOrganizations } from "@/hooks/landing/useLandingOrganizations";

interface OrgCardProps {
  name: string;
  address: string | null;
  logoUrl: string | null;
}

function OrgCard({ name, address, logoUrl }: OrgCardProps) {
  return (
    <div className="flex items-center gap-5 px-8 py-7 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200 cursor-default select-none shrink-0">
      <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-muted">
        {logoUrl ? (
          <Image
            src={getOrgLogoUrl(logoUrl)}
            alt={name}
            fill
            className="object-contain p-3"
            unoptimized
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-xl font-semibold text-card-foreground leading-tight whitespace-nowrap">
          {name}
        </p>
        <p className="text-base text-muted-foreground whitespace-nowrap">
          {address ?? "\u2014"}
        </p>
      </div>
    </div>
  );
}

function OrgCardSkeleton() {
  return (
    <div className="flex items-center gap-5 px-8 py-7 rounded-xl border border-border bg-card shrink-0">
      <Skeleton className="w-28 h-28 rounded-xl shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function SchoolCarousel() {
  const { data: orgs, isLoading, isError } = useLandingOrganizations();

  if (isLoading) {
    const skeletons = Array.from({ length: 4 });
    return (
      <div className="space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by leading institutions worldwide
        </p>
        <div className="flex gap-5 overflow-hidden py-8">
          {skeletons.map((_, i) => (
            <OrgCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !orgs || orgs.length === 0) {
    return null;
  }

  const tripled = [...orgs, ...orgs, ...orgs];

  return (
    <>
      <style>
        {`
          @keyframes scroll-ltr {
            0%   { transform: translateX(-33.33%); }
            100% { transform: translateX(0); }
          }
          .scroll-ltr {
            animation: scroll-ltr 40s linear infinite;
          }
        `}
      </style>
      <div className="space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by leading institutions worldwide
        </p>
        <div className="group relative overflow-hidden py-8">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />
          <div className="flex w-max gap-5 will-change-transform scroll-ltr group-hover:[animation-play-state:paused]">
            {tripled.map((org, i) => (
              <OrgCard
                key={`${org.id}-${i}`}
                name={org.name}
                address={org.address}
                logoUrl={org.logo_url}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}