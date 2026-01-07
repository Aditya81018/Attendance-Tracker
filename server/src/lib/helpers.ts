export function getKeyByValue<T extends Record<string, any>>(
  obj: T,
  value: T[keyof T],
): keyof T | undefined {
  return (Object.keys(obj) as Array<keyof T>).find((key) => obj[key] === value);
}
