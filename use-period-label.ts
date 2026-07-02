"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Period } from "@/types/api";

/** Returns the selected quarter label from ?period=, falling back to whichever period is marked active. */
export function usePeriodLabel(): string | undefined {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("period") ?? undefined;

  const { data } = useQuery({
    queryKey: ["periods"],
    queryFn: () => api.get<{ periods: Period[] }>("/api/periods"),
    enabled: !fromUrl,
  });

  return fromUrl ?? data?.periods.find((p) => p.isActive)?.label;
}
