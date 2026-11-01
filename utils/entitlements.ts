export function hasPremium(
  entitlement:
    { isActive?: boolean; expirationDate?: string | null } | undefined,
  now = Date.now(),
): boolean {
  return (
    entitlement?.isActive === true &&
    (entitlement.expirationDate == null ||
      new Date(entitlement.expirationDate).getTime() > now)
  );
}
