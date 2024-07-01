import { describe, it, assert, vi, beforeEach, Mock } from "vitest";
import { isVanPrimitive, isVanPropValue, watchVar } from "./main";

describe("test isPrimitive type guard", () => {
  it("returns 'true' for type 'string'", () => {
    assert.isTrue(isVanPrimitive("foo"));
  });

  it("returns 'true' for type 'number'", () => {
    assert.isTrue(isVanPrimitive(42));
  });

  it("returns 'true' for type 'boolean'", () => {
    assert.isTrue(isVanPrimitive(false));
  });

  it("returns 'true' for type 'bigint'", () => {
    assert.isTrue(isVanPrimitive(BigInt("0x1fffffffffffff")));
  });

  it("returns 'false' for 'undefined'", () => {
    assert.isFalse(isVanPrimitive(undefined));
  });

  it("returns 'false' for 'null'", () => {
    assert.isFalse(isVanPrimitive(null));
  });

  it("returns 'false' for type 'object'", () => {
    assert.isFalse(isVanPrimitive({ foo: "bar" }));
  });

  it("returns 'false' for type 'function'", () => {
    assert.isFalse(isVanPrimitive(() => "foo"));
  });

  it("returns 'false' for type 'symbol'", () => {
    assert.isFalse(isVanPrimitive(Symbol("foo")));
  });
});

describe("test isVanPropValue type guard", () => {
  it("returns 'true' for 'null'", () => {
    assert.isTrue(isVanPropValue(null));
  });

  it("returns 'false' for 'undefined'", () => {
    assert.isFalse(isVanPropValue(undefined));
  });

  it("returns 'true' for valid function signatures", () => {
    [
      (e?: any) => {
        console.log(e);
      },
      (e?: any) => {
        console.log(e);
        return;
      },
      (e?: any) => {
        console.log(e);
        return undefined;
      },
      (e?: any) => {
        console.log(e);
        return void 0;
      },
    ].forEach((fn) => {
      assert.isTrue(isVanPropValue(fn));
    });
  });

  it("returns 'false' for invalid function signatures", () => {
    [
      (e: any) => {
        return e;
      },
      (e: any, f: any) => {
        console.log(e, f);
      },
    ].forEach((fn) => {
      assert.isFalse(isVanPropValue(fn));
    });
  });

  it("returns 'true' for the van 'Primitive' type", () => {
    ["foo", 42, true, BigInt(BigInt("0x1fffffffffffff"))].forEach((item) => {
      assert.isTrue(isVanPropValue(item));
    });
  });
});

describe("test watchVar helper function", () => {
  let getVal: Mock;
  let callback: Mock;

  beforeEach(() => {
    getVal = vi.fn();
    callback = vi.fn();
    vi.useFakeTimers();
  });

  it("invokes the callback when the value changes", () => {
    getVal.mockReturnValueOnce(1);
    watchVar(getVal, callback);
    getVal.mockReturnValueOnce(2);
    vi.advanceTimersByTime(1);
    assert.isTrue(callback.mock.calls.length === 1);
  });

  it("does not invoke the callback when the value has not changed", () => {
    getVal.mockReturnValueOnce(1);
    watchVar(getVal, callback);
    getVal.mockReturnValueOnce(1);
    vi.advanceTimersByTime(1);
    assert.isTrue(callback.mock.calls.length === 0);
  });
});
