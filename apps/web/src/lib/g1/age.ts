/** Full years and remaining months elapsed between two ISO (yyyy-mm-dd) dates. */
export function ageBetween(birthIso: string, asOfIso: string): { years: number; months: number } {
  const birth = new Date(birthIso);
  const asOf = new Date(asOfIso);
  let years = asOf.getFullYear() - birth.getFullYear();
  let months = asOf.getMonth() - birth.getMonth();
  if (asOf.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months };
}
