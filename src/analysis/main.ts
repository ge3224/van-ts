import { Primitive, PropValue, State } from "@/van";
import * as acorn from "acorn";
import * as walk from "acorn-walk";

export function isVanPrimitive(input: unknown): input is Primitive {
  return ["string", "number", "boolean", "bigint"].includes(typeof input);
}

export function isVanState<T>(input: unknown): input is State<T> {
  if (!input) {
    return false;
  }
  if (typeof input !== "object") {
    return false;
  }
  let hasProps = ["val", "oldVal", "rawVal"].every((prop) =>
    Object.hasOwn(input, prop)
  );

  if (!hasProps) {
    return false;
  }

  const s = input as State<T>;

  return typeof s.val === typeof s.oldVal && typeof s.val === typeof s.rawVal;
}

function isValidPropValueFn(
  node:
    | acorn.FunctionDeclaration
    | acorn.FunctionExpression
    | acorn.ArrowFunctionExpression
    | acorn.AnonymousFunctionDeclaration
): boolean {
  const singleParam =
    node.params.length === 1 && node.params[0].type === "Identifier";
  let invalidReturn = false;
  walk.simple(node.body, {
    ReturnStatement(returnNode) {
      if (returnNode.argument) {
        if (
          returnNode.argument.type !== "Identifier" ||
          returnNode.argument.name !== "undefined"
        ) {
          if (
            !(
              returnNode.argument.type === "UnaryExpression" &&
              returnNode.argument.operator === "void"
            )
          ) {
            invalidReturn = true;
          }
        }
      }
    },
  });
  return singleParam && !invalidReturn;
}

function isValidPropValueArrowFn(node: acorn.ArrowFunctionExpression): boolean {
  const hasSingleParam =
    node.params.length === 1 && node.params[0].type === "Identifier";

  if (node.body.type === "BlockStatement") {
    return isValidPropValueFn(node);
  } else {
    // Implicit return in arrow function
    const body = node.body;
    if (body.type === "Identifier" || body.type === "Literal") {
      return false;
    } else if (
      (body.type === "UnaryExpression" && body.operator === "void") ||
      body.type === "UpdateExpression" ||
      body.type === "CallExpression"
    ) {
      return hasSingleParam;
    } else {
      return false;
    }
  }
}

export function isVanPropValue(input: unknown): input is PropValue {
  if (input === null) {
    return true;
  }
  if (input === undefined) {
    return false;
  }

  if (typeof input === "function") {
    const str = (input as Function).toString();
    const ast = acorn.parse(str, { ecmaVersion: 2020 });
    let valid = false;
    walk.simple(ast, {
      FunctionDeclaration(node) {
        valid = isValidPropValueFn(node);
      },
      FunctionExpression(node) {
        valid = isValidPropValueFn(node);
      },
      ArrowFunctionExpression(node) {
        valid = isValidPropValueArrowFn(node);
      },
    });
    return valid;
  }

  return isVanPrimitive(input);
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
