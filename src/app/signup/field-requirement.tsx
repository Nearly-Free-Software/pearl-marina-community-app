export function FieldRequirement({ kind }: { kind: "required" | "optional" | "conditional" }) {
  const styles = kind === "required"
    ? "bg-red-50 text-red-700 ring-red-200"
    : kind === "conditional"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-secondary text-muted-foreground ring-border";

  return (
    <span aria-hidden="true" className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${styles}`}>
      {kind}
    </span>
  );
}

export function FormRequirementLegend() {
  return (
    <p className="rounded-lg border bg-secondary/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
      Fields marked <span className="font-semibold text-red-700">Required</span> must be completed. The ID field is required only when using a new or different email address.
    </p>
  );
}
