export function allowPublicMotion(
  animateCarousels: unknown,
  editMode: boolean,
  reducedMotion: boolean,
  a11yMotionOff = false,
): boolean {
  if (a11yMotionOff || reducedMotion || editMode || animateCarousels === false) {
    return false;
  }
  return true;
}
