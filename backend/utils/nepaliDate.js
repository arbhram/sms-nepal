export function adToBSYear(date = new Date()) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return (m > 4 || (m === 4 && d >= 14)) ? y + 57 : y + 56;
}

export function currentBSYear() {
  return adToBSYear(new Date());
}

export function currentAcademicYear() {
  return String(currentBSYear());
}
