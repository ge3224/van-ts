import { Primitive, PropValue } from "@/van";

export function isVanPrimitive(input: unknown): input is Primitive {
  return ["string", "number", "boolean", "bigint"].includes(typeof input);
}

export function isVanPropValue(input: unknown): input is PropValue {
  return false;
}

export function watchVar(
  getVal: () => any,
  callback: (newVal: any) => void
): void {
  let previous = getVal();
  setInterval(() => {
    const latest = getVal();
    if (latest !== previous) {
      callback(latest);
      previous = latest;
    }
  }, 1);
}
