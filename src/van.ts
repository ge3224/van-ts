/**
 * A type representing primitive JavaScript types.
 */
export type Primitive = string | number | boolean | bigint;

/**
 * A type representing a property value which can be a primitive, a function,
 * or null.
 */
export type PropValue = Primitive | ((e: any) => void) | null;

/**
 * A type representing a property value, a state view of a property value, or a
 * function returning a property value.
 */
export type PropValueOrDerived =
  | PropValue
  | StateView<PropValue>
  | (() => PropValue);

/**
 * A type representing partial props with known keys for a specific
 * element type.
 */
export type Props = Record<string, PropValueOrDerived> & {
  class?: PropValueOrDerived;
};

export type PropsWithKnownKeys<ElementType> = Partial<{
  [K in keyof ElementType]: PropValueOrDerived;
}>;

/**
 * A type representing valid child DOM values.
 */
export type ValidChildDomValue = Primitive | Node | null | undefined;

/**
 * A type representing functions that generate DOM values.
 */
export type BindingFunc =
  | ((dom?: Node) => ValidChildDomValue)
  | ((dom?: Element) => Element);

/**
 * A type representing various possible child DOM values.
 */
export type ChildDom =
  | ValidChildDomValue
  | StateView<Primitive | null | undefined>
  | BindingFunc
  | readonly ChildDom[];

type ConnectedDom = { isConnected: number };

type Binding = {
  f: BindingFunc;
  _dom: HTMLElement | null | undefined;
}

type Listener = {
  f: BindingFunc;
  s: State<any>;
  _dom: HTMLElement | null | undefined;
}

/**
 * Interface representing a state object with various properties and bindings.
 */
export interface State<T> {
  val: T | undefined;
  readonly oldVal: T | undefined;
  rawVal: T | undefined;
  _oldVal: T | undefined;
  _bindings: Array<Binding>;
  _listeners: Array<Listener>;
  _dom?: HTMLElement | null | undefined;
}

/**
 * A type representing a read-only view of a `State` object.
 */
export type StateView<T> = Readonly<State<T>>;

/**
 * A type representing a value that can be either a `State` object or a direct
 * value of type `T`.
 */
export type Val<T> = State<T> | T;

/**
 * Represents a function type that constructs a tagged result using provided
 * properties and children.
 */
export type TagFunc<Result> = (
  first?: (Props & PropsWithKnownKeys<Result>) | ChildDom,
  ...rest: readonly ChildDom[]
) => Result;

/**
 * Interface representing dependencies with sets for getters and setters.
 */
interface Dependencies {
  _getters: Set<unknown>;
  _setters: Set<unknown>;
}

/**
 * A function type for searching property descriptors in a prototype chain.
 */
type PropertyDescriptorSearchFn = (
  proto: any
) => ReturnType<typeof Object.getOwnPropertyDescriptor> | undefined;

/**
 * A function type for setting event listeners.
 */
type EventSetterFn = (
  v: EventListenerOrEventListenerObject,
  oldV?: EventListenerOrEventListenerObject
) => void;

/**
 * A function type for setting property values.
 */
type PropSetterFn = (value: any) => void;

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
 * While VanJS prefers using `let` instead of `const` to help reduce bundle
 * size, this project employs the `const` keyword. Bundle sizes are managed
 * during TypeScript compilation and bundling, incorporating minification and
 * tree shaking.
 *
 * The following are global variables used by VanJS to alias some builtin
 * symbols and reduce the bundle size.
 */

/**
 * A constant function returning the prototype of an object.
 */
const protoOf = Object.getPrototypeOf;

/**
 * VanJS implementation:
 *
 * ```
 * let changedStates, derivedStates, curDeps, curNewDerives, alwaysConnectedDom = {isConnected: 1}
 * ```
 */

/**
 * Set containing changed states.
 */
let changedStates: Set<State<any>>;

/**
 * Set containing derived states.
 */
let derivedStates: Set<State<any>>;

/**
 * Current dependencies object, containing getters and setters.
 */
let curDeps:
  | { _getters?: { [key: string]: any }; _setters?: { [key: string]: any } }
  | undefined;

/**
 * Array containing current new derivations.
 */
let curNewDerives: Array<any>;

/**
 * Constant representing a DOM object that is always considered connected.
 */
const alwaysConnectedDom: ConnectedDom = { isConnected: 1 };

/**
 * VanJS implementation:
 *
 * ```
 * let gcCycleInMs = 1000, statesToGc, propSetterCache = {}
 * ```
 */

/**
 * Constant representing the garbage collection cycle duration in milliseconds.
 */
const gcCycleInMs = 1000;

/**
 * Set containing objects marked for garbage collection.
 */
let forGarbageCollection: Set<any> | undefined;

/**
 * Cache object for property setters.
 */
const propSetterCache: { [key: string]: ((v: any) => void) | 0 } = {};

/**
 * VanJS implementation:
 *
 * ```
 * let objProto = protoOf(alwaysConnectedDom), funcProto = protoOf(protoOf), _undefined
 * ```
 */

/**
 * Prototype of the `alwaysConnectedDom` object.
 */
const objProto = protoOf(alwaysConnectedDom);

/**
 * Prototype of the `Function` object.
 */
const funcProto = Function.prototype;

/**
 * Placeholder for undefined value.
 */
let _undefined: any;

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
 */
function addAndScheduleOnFirst<T>(
  set: Set<State<T>> | undefined,
  state: State<T>,
  fn: () => void,
  waitMs?: number
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
 */
function runAndCaptureDependencies(
  fn: Function,
  deps: Dependencies | undefined,
  arg: ValidChildDomValue | Element | undefined
): ValidChildDomValue | Element | undefined {
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

function keepConnected(l: Listener[]): Listener[];
function keepConnected(l: Binding[]): Binding[];
/**
 * Filters an array of Connectable objects, returning only those whose `_dom`
 * property is connected to the current document.
 *
 * VanJS implementation:
 *
 * ```
 * let keepConnected = l => l.filter(b => b._dom?.isConnected)
 * ```
 */
function keepConnected(l: Array<Binding> | Array<Listener>): Array<Binding> | Array<Listener> {
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
 */
function addForGarbageCollection<T>(discard: State<T>): void {
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

/**
 * Prototype for state objects, providing getter and setter for `val` and
 * `oldVal`.
 *
 * VanJS implementation:
 *
 * ```
 * let stateProto = {
 *   get val() {
 *     curDeps?._getters?.add(this)
 *     return this.rawVal
 *   },
 *
 *   get oldVal() {
 *     curDeps?._getters?.add(this)
 *     return this._oldVal
 *   },
 *
 *   set val(v) {
 *     curDeps?._setters?.add(this)
 *     if (v !== this.rawVal) {
 *       this.rawVal = v
 *       this._bindings.length + this._listeners.length ?
 *         (derivedStates?.add(this), changedStates = addAndScheduleOnFirst(changedStates, this, updateDoms)) :
 *         this._oldVal = v
 *     }
 *   },
 * }
 * ```
 */
const stateProto = {
  get val(): ValidChildDomValue {
    curDeps?._getters?.add(this);
    return (this as State<any>).rawVal;
  },

  get oldVal(): ValidChildDomValue {
    curDeps?._getters?.add(this);
    return (this as State<any>)._oldVal;
  },

  set val(v) {
    const s = this as State<any>;
    curDeps?._setters?.add(s);
    if (v !== s.rawVal) {
      s.rawVal = v;
      s._bindings.length + s._listeners.length
        ? (derivedStates?.add(s),
          (changedStates = addAndScheduleOnFirst(changedStates, s, updateDoms)))
        : (s._oldVal = v);
    }
  },
};

/**
 * Generates a property descriptor with preset characteristics for properties
 * of a state object.
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
 */
function state<T>(initVal?: T): State<T> {
  // In contrast to the VanJS implementation (above), where reducing the bundle
  // size is a key priority, we use the `Object.create` method instead of the
  // `Object.prototype.__proto__` accessor since the latter is no longer
  // recommended.
  //
  // [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto)
  return Object.create(stateProto, {
    rawVal: statePropertyDescriptor(initVal),
    _oldVal: statePropertyDescriptor(initVal),
    _bindings: statePropertyDescriptor([]),
    _listeners: statePropertyDescriptor([]),
  });
}

function isNode(value: any): value is Node {
  return value && typeof value === "object" && "nodeType" in value;
}

/**
 * Binds a function to a DOM element, capturing its dependencies and updating
 * the DOM as needed.
 *
 * VanJS implementation:
 *
 * ```
 * let bind = (f, dom) => {
 *   let deps = { _getters: new Set(), _setters: new Set() },
 *     binding = { f },
 *     prevNewDerives = curNewDerives;
 *   curNewDerives = [];
 *   let newDom = runAndCaptureDependencies(f, deps, dom);
 *   newDom = (newDom ?? document).nodeType ? newDom : new Text(newDom);
 *   for (let d of deps._getters)
 *     deps._setters.has(d) ||
 *       (addForGarbageCollection(d), d._bindings.push(binding));
 *   for (let l of curNewDerives) l._dom = newDom;
 *   curNewDerives = prevNewDerives;
 *   return (binding._dom = newDom);
 * };
 * ```
 */
function bind(
  f: Function,
  dom?: ValidChildDomValue | Element | undefined
): ValidChildDomValue | Element {
  let deps: Dependencies = { _getters: new Set(), _setters: new Set() };
  let binding: { [key: string]: any } = { f };
  let prevNewDerives = curNewDerives;

  curNewDerives = [];
  let newDom = runAndCaptureDependencies(f, deps, dom);

  newDom = isNode(newDom ?? document)
    ? newDom
    : new Text(newDom as string | undefined);

  for (let d of deps._getters)
    deps._setters.has(d) ||
      (addForGarbageCollection(d as any), (d as any)._bindings.push(binding));
  for (let l of curNewDerives) l._dom = newDom;
  curNewDerives = prevNewDerives;
  return (binding._dom = newDom);
}

/**
 * Derives a new state by running a binding function and capturing its
 * dependencies.
 *
 * VanJS implementation:
 *
 * ```
 * let derive = (f, s = state(), dom) => {
 *   let deps = {_getters: new Set, _setters: new Set}, listener = {f, s}
 *   listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom
 *   s.val = runAndCaptureDeps(f, deps, s.rawVal)
 *   for (let d of deps._getters)
 *     deps._setters.has(d) || (addStatesToGc(d), d._listeners.push(listener))
 *   return s
 * }
 * ```
 */
function derive(
  f: BindingFunc,
  s?: State<any>,
  dom?: HTMLElement | null | undefined
): State<any> {
  s = s ?? state();
  let deps = { _getters: new Set(), _setters: new Set() };
  let listener: { [key: string]: any } = { f, s };
  listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom;
  s.val = runAndCaptureDependencies(f, deps, s.rawVal);
  for (let d of deps._getters)
    deps._setters.has(d) ||
      (addForGarbageCollection(d as any), (d as any)._listeners.push(listener));
  return s;
}

/**
 * Appends child elements or text nodes to a given DOM element.
 *
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
 *     child != y_undefined && dom.append(child);
 *   }
 *   return dom;
 * };
 * ```
 */
function add(
  dom: Element | HTMLElement,
  ...children: readonly ChildDom[]
): Element | HTMLElement {
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

/**
 * Creates a new DOM element with specified namespace, tag name, properties,
 * and children.
 *
 * VanJS implementation:
 *
 * ```
 * let tag = (ns, name, ...args) => {
 *   let [props, ...children] =
 *     protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];
 *   let dom = ns
 *     ? document.createElementNS(ns, name)
 *     : document.createElement(name);
 *   for (let [k, v] of Object.entries(props)) {
 *     let getPropDescriptor = (proto) =>
 *       proto
 *         ? Object.getOwnPropertyDescriptor(proto, k) ??
 *         getPropDescriptor(protoOf(proto))
 *         : _undefined;
 *     let cacheKey = name + "," + k;
 *     let propSetter =
 *       propSetterCache[cacheKey] ??
 *       (propSetterCache[cacheKey] = getPropDescriptor(protoOf(dom))?.set ?? 0);
 *     let setter = k.startsWith("on")
 *       ? (v, oldV) => {
 *         let event = k.slice(2);
 *         dom.removeEventListener(event, oldV);
 *         dom.addEventListener(event, v);
 *       }
 *       : propSetter
 *         ? propSetter.bind(dom)
 *         : dom.setAttribute.bind(dom, k);
 *     let protoOfV = protoOf(v ?? 0);
 *     k.startsWith("on") ||
 *       (protoOfV === funcProto && ((v = derive(v)), (protoOfV = stateProto)));
 *     protoOfV === stateProto
 *       ? bind(() => (setter(v.val, v._oldVal), dom))
 *       : setter(v);
 *   }
 *   return add(dom, ...children);
 * };
 * ````
 */
function tag(ns: string | null, name: string, ...args: any): Element {
  const [props, ...children] =
    protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];

  const dom: Element | HTMLElement = ns
    ? document.createElementNS(ns, name)
    : document.createElement(name);

  for (let [k, v] of Object.entries(props)) {
    const getDesc: PropertyDescriptorSearchFn = (proto: any) =>
      proto
        ? Object.getOwnPropertyDescriptor(proto, k as PropertyKey) ??
        getDesc(protoOf(proto))
        : _undefined;

    const cacheKey = `${name},${k}`;

    const propSetter =
      propSetterCache[cacheKey] ??
      (propSetterCache[cacheKey] = getDesc(protoOf(dom))?.set ?? 0);

    const setter: PropSetterFn | EventSetterFn = k.startsWith("on")
      ? (
        v: EventListenerOrEventListenerObject,
        oldV?: EventListenerOrEventListenerObject
      ) => {
        const event = k.slice(2);
        if (oldV) dom.removeEventListener(event, oldV);
        dom.addEventListener(event, v);
      }
      : propSetter
        ? propSetter.bind(dom)
        : dom.setAttribute.bind(dom, k);

    let protoOfV = protoOf(v ?? 0);

    k.startsWith("on") ||
      (protoOfV === funcProto &&
        ((v = derive(v as BindingFunc)), (protoOfV = stateProto)));

    protoOfV === stateProto
      ? bind(() => (setter((v as any).val, (v as any)._oldVal), dom))
      : setter(v as EventListenerOrEventListenerObject);
  }

  return add(dom, ...children);
}

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
 */
function proxyHandler(namespace?: string): ProxyHandler<object> {
  return {
    get: (_: never, name: string) =>
      tag.bind(_undefined, namespace ?? null, name),
  };
}

/**
 * Creates a Proxy object for managing tags and namespaces.
 *
 * VanJS implementation:
 *
 * ```
 * let tags = new Proxy((ns) => new Proxy(tag, handler(ns)), handler());
 * ```
 */
const tags = new Proxy(
  (namespace?: string) =>
    new Proxy(tag, proxyHandler(namespace)) as NamespaceFunction,
  proxyHandler()
) as Tags & NamespaceFunction;

function update(dom: HTMLElement, newDom: ValidChildDomValue) {
  newDom ? newDom !== dom && dom.replaceWith(newDom as Node) : dom.remove();
}

/**
 * Updates DOM elements based on changed and derived states.
 *
 * VanJS implementation:
 * ```
 * let updateDoms = () => {
 *   let iter = 0, derivedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal)
 *   do {
 *     derivedStates = new Set
 *     for (let l of new Set(derivedStatesArray.flatMap(s => s._listeners = keepConnected(s._listeners))))
 *       derive(l.f, l.s, l._dom), l._dom = _undefined
 *   } while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length)
 *   let changedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal)
 *   changedStates = _undefined
 *   for (let b of new Set(changedStatesArray.flatMap(s => s._bindings = keepConnected(s._bindings))))
 *     update(b._dom, bind(b.f, b._dom)), b._dom = _undefined
 *   for (let s of changedStatesArray) s._oldVal = s.rawVal
 * }
 * ```
 */
function updateDoms() {
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
    b._dom && update(b._dom, bind(b.f, b._dom)), (b._dom = _undefined);

  for (let s of changedStatesArray) s._oldVal = s.rawVal;
}

/**
 * Hydrates a DOM node by applying a transformation function and updating
 * the node.
 *
 * VanJS implementation:
 * ```
 * let hydrate = (dom, f) => update(dom, bind(f, dom));
 * ```
 */
function hydrate(
  dom: HTMLElement,
  f: (dom: HTMLElement) => HTMLElement | null | undefined
): HTMLElement | void {
  return update(dom, bind(f, dom));
}

export default { add, tags, state, derive, hydrate };
