// supabase/functions/_shared/cap-check.ts

export function computeWeekStart(isoTimestamp: string, timezone: string): string {
  const date = new Date(isoTimestamp);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")!.value;
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  const offsets: Record<string, number> = {
    Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
  };

  const localDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
  localDate.setUTCDate(localDate.getUTCDate() - offsets[weekday]);

  return localDate.toISOString().slice(0, 10);
}

export function determineModel(
  isPaid: boolean,
  paidModel: string,
  freeModel: string,
  forceModel: string | null,
): string {
  if (forceModel) return forceModel;
  return isPaid ? paidModel : freeModel;
}

interface EvaluateCapInput {
  isPaid: boolean;
  reviewCount: number;
  freeCapPerWeek: number;
  paidDailyCap: number;
}

interface EvaluateCapResult {
  allowed: boolean;
  reason?: "cap_reached" | "paid_daily_cap";
}

export function evaluateCap(input: EvaluateCapInput): EvaluateCapResult {
  if (input.isPaid) {
    if (input.reviewCount >= input.paidDailyCap) {
      return { allowed: false, reason: "paid_daily_cap" };
    }
    return { allowed: true };
  }

  if (input.reviewCount >= input.freeCapPerWeek) {
    return { allowed: false, reason: "cap_reached" };
  }
  return { allowed: true };
}
