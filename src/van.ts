/**
 * VanJS uses `let` keyword instead of `const` for reducing the bundle size.
 */

export type Primitive = string | number | boolean | bigint;

export type PropValue = Primitive | ((e: any) => void) | null;

export type PropValueOrDerived =
  | PropValue
  | StateView<PropValue>
  | (() => PropValue);

export type Props = Record<string, PropValueOrDerived> & {
  class?: PropValueOrDerived;
};

export type PropsWithKnownKeys<ElementType> = Partial<{
  [K in keyof ElementType]: PropValueOrDerived;
}>;

export type ValidChildDomValue = Primitive | Node | null | undefined;

export type BindingFunc =
  | ((dom?: Node) => ValidChildDomValue)
  | ((dom?: Element) => Element);

export type ChildDom =
  | ValidChildDomValue
  | StateView<Primitive | null | undefined>
  | BindingFunc
  | readonly ChildDom[];

export interface State<T> {
  val: T | undefined;
  readonly oldVal: T | undefined;
  readonly rawVal: T | undefined;
  _oldVal: T | undefined;
  _bindings: unknown[];
  _listeners: unknown[];
}

export type StateView<T> = Readonly<State<T>>;

export type Val<T> = State<T> | T;

type Connectable = { _dom?: { isConnected: boolean } };

/**
 * The following are global variables used by VanJS to alias some builtin
 * symbols and reduce the bundle size.
 */

let protoOf = Object.getPrototypeOf;

/**
 * VanJS implementation:
 *
 * ```
 * let changedStates, derivedStates, curDeps, curNewDerives, alwaysConnectedDom = {isConnected: 1}
 * ```
 */
let changedStates: Set<State<any>>;
let derivedStates: Set<State<any>>;
let curDeps: unknown;
let curNewDerives: unknown;
let alwaysConnectedDom = { isConnected: 1 };

/**
 * VanJS implementation:
 *
 * ```
 * let gcCycleInMs = 1000, statesToGc, propSetterCache = {}
 * ```
 */
let gcCycleInMs = 1000;
let forGarbageCollection: Set<any> | undefined;
let propSetterCache = {};

/**
 * VanJS implementation:
 *
 * ```
 * let objProto = protoOf(alwaysConnectedDom), funcProto = protoOf(protoOf), _undefined
 * ```
 */
let objProto = protoOf(alwaysConnectedDom);
let funcProto = protoOf(protoOf);
let _undefined: unknown;

/**
 * Adds a state object to a set and schedules an associated function to be
 * executed after a specified delay if the set is initially undefined.
 *
 * VanJS implementation:
 *
 * ```
 * let addAndScheduleOnFirst = (set, s, f, waitMs) =>
 *   (set ?? (setTimeout(f, waitMs), new Set)).add(s)
 * ```
 *
 * @template T The type parameter representing the state type stored in the set.
 *
 * @param {Set<State<T>> | undefined} set
 * - The set to which the state will be added. If this parameter is undefined,
 *   a new set is created.
 *
 * @param {State<T>} state
 * - The state object to be added to the set.
 *
 * @param {() => void} fn
 * - The function to execute if the set is initially undefined, scheduled to
 *   run after `waitMs` milliseconds.
 *
 * @param {number} waitMs
 * - The number of milliseconds to wait before executing the function `fn`.
 *
 * @returns {Set<State<T>>} The set with the new state added.
 */
function addAndScheduleOnFirst<T>(
  set: Set<State<T>> | undefined,
  state: State<T>,
  fn: () => void,
  waitMs: number
): Set<State<T>> {
  if (set === undefined) {
    setTimeout(fn, waitMs);
    set = new Set<State<T>>();
  }
  set.add(state);
  return set;
}

/**
 * Executes a function with a given argument and tracks dependencies during
 * its execution.
 *
 * VanJS implementation:
 *
 * ```
 * let runAndCaptureDeps = (f, deps, arg) => {
 *   let prevDeps = curDeps
 *   curDeps = deps
 *   try {
 *     return f(arg)
 *   } catch (e) {
 *     console.error(e)
 *     return arg
 *   } finally {
 *     curDeps = prevDeps
 *   }
 * }
 * ```
 *
 * @param {Function} fn
 * - A function that takes an argument of type T and returns a value of type R.
 *
 * @param {unknown} deps
 * - The dependencies to track or use during the execution of the function.
 *
 * @param {T} arg
 * - The argument to pass to the function `f`.
 *
 * @returns {R | T}
 * - Returns the result of the function `f` if it executes successfully;
 *   otherwise, returns the argument `arg` if an error occurs.
 *
 * @template T
 * - The type of the argument passed to the function.
 *
 * @template R
 * - The type of the result returned by the function.
 */
function runAndCaptureDependencies<T, R>(
  fn: (arg: T) => R,
  deps: unknown,
  arg: T
): R | T {
  let prevDeps = curDeps;
  curDeps = deps;

  try {
    return fn(arg);
  } catch (e) {
    console.error(e);
    return arg;
  } finally {
    curDeps = prevDeps;
  }
}

/**
 * Filters an array of Connectable objects, returning only those whose `_dom`
 * property is connected to the current document.
 *
 * VanJS implementation:
 *
 * ```
 * let keepConnected = l => l.filter(b => b._dom?.isConnected)
 * ```
 *
 * @param {T[]} l
 * - An array of objects that extend the Connectable interface, each having
 *   potentially a `_dom` property which contains an `isConnected` boolean.
 *
 * @returns {T[]}
 * - An array containing only the Connectable objects that are connected.
 *
 * @template T
 * - Extends the Connectable interface, which implies each object has an
 *   optional `_dom` property.
 */
function keepConnected<T extends Connectable>(l: T[]): T[] {
  return l.filter((b) => b._dom?.isConnected);
}

/**
 * Adds a state object to a collection that will be processed for
 * garbage collection.
 *
 * VanJS implementation:
 *
 * ```
 * let addStatesToGc = (d) => (statesToGc = addAndScheduleOnFirst(
 *   statesToGc,
 *   d,
 *   () => {
 *     for (let s of statesToGc)
 *       (s._bindings = keepConnected(s._bindings)),
 *         (s._listeners = keepConnected(s._listeners));
 *     statesToGc = _undefined;
 *   },
 *   gcCycleInMs
 * ));
 * ```
 *
 * @template T
 * - The type of the value stored within the state.
 *
 * @param {State<T>} discard
 * - The state object to be added to the garbage collection process. This
 *   object must have `_bindings` and `_listeners` properties.
 */
function slateForGarbageCollection<T>(discard: State<T>): void {
  forGarbageCollection = addAndScheduleOnFirst(
    forGarbageCollection,
    discard,
    () => {
      if (forGarbageCollection) {
        for (let s of forGarbageCollection) {
          s._bindings = keepConnected(s._bindings);
          s._listeners = keepConnected(s._listeners);
        }
        forGarbageCollection = undefined; // Resets `forGarbageCollection` after processing
      }
    },
    gcCycleInMs
  );
}

let stateProto = {
  get val() {
    curDeps?._getters?.add(this);
    return this.rawVal;
  },

  get oldVal() {
    curDeps?._getters?.add(this);
    return this._oldVal;
  },

  set val(v) {
    curDeps?._setters?.add(this);
    if (v !== this.rawVal) {
      this.rawVal = v;
      this._bindings.length + this._listeners.length
        ? (derivedStates?.add(this),
          (changedStates = addAndScheduleOnFirst(
            changedStates,
            this,
            updateDoms
          )))
        : (this._oldVal = v);
    }
  },
};

/**
 * Generates a property descriptor with preset characteristics for properties
 * of a state object.
 *
 * @template T
 * - The type of the value to be set in the property descriptor.
 *
 * @param {T} value
 * - The value to be assigned to the property.
 *
 * @returns {PropertyDescriptor}
 * - A property descriptor object with the given value and with `writable`,
 *   `configurable`, and `enumerable` properties all set to true.
 */
function statePropertyDescriptor<T>(value: T): PropertyDescriptor {
  return {
    writable: true,
    configurable: true,
    enumerable: true,
    value: value,
  };
}

/**
 * This function initializes a state object with a value, bindings, and
 * listeners. The properties of the created object are configured to be
 * enumerable, writable, and configurable.
 *
 * VanJS implementation:
 *
 * ```
 * let state = initVal => ({
 *   __proto__: stateProto,
 *   rawVal: initVal,
 *   _oldVal: initVal,
 *   _bindings: [],
 *   _listeners: [],
 * })
 * ```
 *
 * @template T
 * - The type of the initial value.
 *
 * @param {T} [initVal]
 * - Optional initial value for the state.
 *
 * @returns {State<T>}
 * - A new state object with properties `rawVal`, `_oldVal`, `_bindings`,
 *   and `_listeners`
 */
function state<T>(initVal?: T): State<T> {
  //  In contrast to the above implementation, where reducing the bundle
  //  size is a key priority, we use the `Object.create` method instead of the
  //  `Object.prototype.__proto__` accessor since the latter is no
  //  longer recommended.
  //
  // [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto)
  return Object.create(stateProto, {
    rawVal: statePropertyDescriptor(initVal),
    _oldVal: statePropertyDescriptor(initVal),
    _bindings: statePropertyDescriptor([]),
    _listeners: statePropertyDescriptor([]),
  });
}

let bind = (f, dom) => {
  let deps = { _getters: new Set(), _setters: new Set() },
    binding = { f },
    prevNewDerives = curNewDerives;
  curNewDerives = [];
  let newDom = runAndCaptureDependencies(f, deps, dom);
  newDom = (newDom ?? document).nodeType ? newDom : new Text(newDom);
  for (let d of deps._getters)
    deps._setters.has(d) ||
      (slateForGarbageCollection(d), d._bindings.push(binding));
  for (let l of curNewDerives) l._dom = newDom;
  curNewDerives = prevNewDerives;
  return (binding._dom = newDom);
};

let derive = (f, s = state(), dom) => {
  let deps = { _getters: new Set(), _setters: new Set() },
    listener = { f, s };
  listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom;
  s.val = runAndCaptureDependencies(f, deps, s.rawVal);
  for (let d of deps._getters)
    deps._setters.has(d) ||
      (slateForGarbageCollection(d), d._listeners.push(listener));
  return s;
};

/**
 * VanJS implementation:
 *
 * ```
 * let add = (dom, ...children) => {
 *   for (let c of children.flat(Infinity)) {
 *     let protoOfC = protoOf(c ?? 0);
 *     let child =
 *       protoOfC === stateProto
 *         ? bind(() => c.val)
 *         : protoOfC === funcProto
 *           ? bind(c)
 *           : c;
 *     child != _undefined && dom.append(child);
 *   }
 *   return dom;
 * };
 * ```
 */
function add(dom: Element, ...children: readonly ChildDom[]): Element {
  // @ts-ignore
  // TypeScript does not currently have a numeric literal type corresponding
  // to `Infinity`.
  // See the [Github Issue](https://github.com/microsoft/TypeScript/issues/32277).
  for (let c of children.flat(Infinity)) {
    let protoOfC = protoOf(c ?? 0);
    let child =
      protoOfC === stateProto
        ? bind(() => c.val)
        : protoOfC === funcProto
          ? bind(c)
          : c;
    child != _undefined && dom.append(child);
  }
  return dom;
}

let tag = (ns, name, ...args) => {
  let [props, ...children] =
    protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];
  let dom = ns
    ? document.createElementNS(ns, name)
    : document.createElement(name);
  for (let [k, v] of Object.entries(props)) {
    let getPropDescriptor = (proto) =>
      proto
        ? Object.getOwnPropertyDescriptor(proto, k) ??
          getPropDescriptor(protoOf(proto))
        : _undefined;
    let cacheKey = name + "," + k;
    let propSetter =
      propSetterCache[cacheKey] ??
      (propSetterCache[cacheKey] = getPropDescriptor(protoOf(dom))?.set ?? 0);
    let setter = k.startsWith("on")
      ? (v, oldV) => {
          let event = k.slice(2);
          dom.removeEventListener(event, oldV);
          dom.addEventListener(event, v);
        }
      : propSetter
        ? propSetter.bind(dom)
        : dom.setAttribute.bind(dom, k);
    let protoOfV = protoOf(v ?? 0);
    k.startsWith("on") ||
      (protoOfV === funcProto && ((v = derive(v)), (protoOfV = stateProto)));
    protoOfV === stateProto
      ? bind(() => (setter(v.val, v._oldVal), dom))
      : setter(v);
  }
  return add(dom, ...children);
};

/**
 * Creates a proxy handler object for intercepting the 'get' property access
 * operation. The handler wraps the access in a function call that binds the
 * accessed property name along with an optional namespace.
 *
 * VanJS implementation:
 *
 * ```
 * let handler = (ns) => ({ get: (_, name) => tag.bind(_undefined, ns, name) });
 * ```
 *
 * @param {string} [namespace]
 * - An optional namespace to be included when binding the property name to the
 *   `tag` function. This can help differentiate or categorize property
 *   accesses if used with multiple proxies or for properties under different
 *   contexts.
 *
 * @returns {object}
 * - Returns an object that contains a 'get' trap for a proxy. This trap is a
 *   function that takes a target object and a property name, and returns a
 *   result of calling `tag.bind()`, effectively intercepting and handling the
 *   property access with customized logic.
 */
function proxyHandler(namespace?: string): ProxyHandler<object> {
  return {
    get: (_: never, name: string) => tag.bind(_undefined, namespace, name),
  };
}

/**
 * Represents a function type that constructs a tagged result using provided
 * properties and children.
 *
 * @template Result
 * - The type of the result produced by the function.
 *
 * @param {Props & PropsWithKnownKeys<Result> | ChildDom} [first]
 * - The initial parameter can either be an object combining Props and
 *   PropsWithKnownKeys specific to Result, or a ChildDom element.
 *
 * @param {...ChildDom[]} rest
 * - Additional ChildDom elements passed as subsequent arguments.
 *
 * @returns {Result}
 * - The result of the tag function, typically a DOM element or a similar construct.
 */
export type TagFunc<Result> = (
  first?: (Props & PropsWithKnownKeys<Result>) | ChildDom,
  ...rest: readonly ChildDom[]
) => Result;

/**
 * Represents a type for a collection of tag functions.
 *
 * This type includes:
 * - A readonly record of string keys to TagFunc<Element> functions, enabling
 *   the creation of generic HTML elements.
 * - Specific tag functions for each HTML element type as defined in
 *   HTMLElementTagNameMap, with the return type corresponding to the specific
 *   type of the HTML element (e.g., HTMLDivElement for 'div',
 *   HTMLAnchorElement for 'a').
 *
 * Usage of this type allows for type-safe creation of HTML elements with
 * specific properties and child elements.
 */
type Tags = Readonly<Record<string, TagFunc<Element>>> & {
  [K in keyof HTMLElementTagNameMap]: TagFunc<HTMLElementTagNameMap[K]>;
};

/**
 * Represents a function type for creating a namespace-specific collection of
 * tag functions.
 *
 * @param {string} namespaceURI
 * - The URI of the namespace for which the tag functions are being created.
 *
 * @returns {Readonly<Record<string, TagFunc<Element>>>}
 * - A readonly record of string keys to TagFunc<Element> functions,
 *   representing the collection of tag functions within the specified
 *   namespace.
 */
type NamespaceFunction = (
  namespaceURI: string
) => Readonly<Record<string, TagFunc<Element>>>;

/**
 * Creates a Proxy object for managing tags and namespaces.
 *
 * VanJS implementation:
 *
 * ```
 * let tags = new Proxy((ns) => new Proxy(tag, handler(ns)), handler());
 * ```
 *
 * @param {string} [namespace]
 * - Optional namespace for tags.
 *
 * @returns {NamespaceFunction}
 * - A function that creates tags within the specified namespace.
 */
let tags = new Proxy(
  (namespace?: string) =>
    new Proxy(tag, proxyHandler(namespace)) as NamespaceFunction,
  proxyHandler()
) as Tags & NamespaceFunction;

let update = (dom, newDom) =>
  newDom ? newDom !== dom && dom.replaceWith(newDom) : dom.remove();

let updateDoms = () => {
  let iter = 0,
    derivedStatesArray = [...changedStates].filter(
      (s) => s.rawVal !== s._oldVal
    );
  do {
    derivedStates = new Set();
    for (let l of new Set(
      derivedStatesArray.flatMap(
        (s) => (s._listeners = keepConnected(s._listeners))
      )
    ))
      derive(l.f, l.s, l._dom), (l._dom = _undefined);
  } while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length);
  let changedStatesArray = [...changedStates].filter(
    (s) => s.rawVal !== s._oldVal
  );
  changedStates = _undefined;
  for (let b of new Set(
    changedStatesArray.flatMap(
      (s) => (s._bindings = keepConnected(s._bindings))
    )
  ))
    update(b._dom, bind(b.f, b._dom)), (b._dom = _undefined);
  for (let s of changedStatesArray) s._oldVal = s.rawVal;
};

/**
 * Hydrates a DOM node by applying a transformation function and updating
 * the node.
 *
 * VanJS implementation:
 * ```
 * let hydrate = (dom, f) => update(dom, bind(f, dom));
 * ```
 *
 * @template T
 * - Extends Node, representing the type of the DOM node being hydrated.
 *
 * @param {T} dom
 * - The DOM node to hydrate. This is the node that will be transformed.
 *
 * @param {(dom: T) => T | null | undefined} f
 * - A transformation function that takes the node as an argument and returns
 *   the transformed
 */
function hydrate<T extends Node>(
  dom: T,
  f: (dom: T) => T | null | undefined
): T {
  return update(dom, bind(f, dom));
}

export default { add, tags, state, derive, hydrate };
