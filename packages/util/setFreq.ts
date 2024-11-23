export const setFreq = (latitude: number, longitude: number, originLatitude: number, originLongitude: number): number => {
  const diff = logarithm(Math.abs((latitude - originLatitude) + (longitude - originLongitude)))
  console.log('差音', diff)
  return 440 + diff
}

function logarithm(x: number, base: number = Math.E): number {
  if (x <= 0) {
      throw new Error("Input x must be greater than 0.");
  }
  if (base <= 0 || base === 1) {
      throw new Error("Base must be greater than 0 and not equal to 1.");
  }

  return Math.log(1 + x) / Math.log(base);
}