import { ConstNode, Node, NodeBuilder, NodeTypeOption, SwizzleOption } from '../Nodes';
// lot of private typescript magic here
export {};
export type Swizzable<T extends Node = Node> = T &
    {
        [key in SwizzleOption | number]: Swizzable;
    };

/** anything that can be passed to {@link nodeObject} and returns a proxy */
export type NodeRepresentation = number | boolean | Node | Swizzable;

/** anything that can be passed to {@link nodeObject} */
export type NodeObjectOption = NodeRepresentation | string;

// same logic as in ShaderNodeObject
export type NodeObject<T> = T extends Node ? Swizzable<T> : T extends number | boolean ? Swizzable<ConstNode> : T;

type MakeObjectOption<T> = T extends Node ? NodeRepresentation : T;
// https://github.com/microsoft/TypeScript/issues/42435#issuecomment-765557874
type MakeObjectOptions<T extends readonly [...unknown[]]> = [...{ [index in keyof T]: MakeObjectOption<T[index]> }];
type RemoveTail<T extends readonly [...unknown[]]> = T extends [unknown, ...infer X] ? X : [];
type RemoveHeadAndTail<T extends readonly [...unknown[]]> = T extends [unknown, ...infer X, unknown] ? X : [];

/**
 * Temporary type to save signatures of 4 constructors. Each element may be tuple or undefined.
 *
 * We use an object instead of tuple or union as it makes stuff easier, especially in Typescript 4.0.
 */
interface Construtors<
    A extends undefined | [...unknown[]],
    B extends undefined | [...unknown[]],
    C extends undefined | [...unknown[]],
    D extends undefined | [...unknown[]],
> {
    a: A;
    b: B;
    c: C;
    d: D;
}

/**
 * Returns all constructors
 *
 * <https://github.com/microsoft/TypeScript/issues/37079>
 * <https://stackoverflow.com/a/52761156/1623826>
 */
type OverloadedConstructorsOf<T> = T extends {
    new (...args: infer A1): unknown;
    new (...args: infer A2): unknown;
    new (...args: infer A3): unknown;
    new (...args: infer A4): unknown;
}
    ? Construtors<A1, A2, A3, A4>
    : T extends {
          new (...args: infer A1): unknown;
          new (...args: infer A2): unknown;
          new (...args: infer A3): unknown;
      }
    ? Construtors<A1, A2, A3, undefined>
    : T extends {
          new (...args: infer A1): unknown;
          new (...args: infer A2): unknown;
      }
    ? Construtors<A1, A2, undefined, undefined>
    : T extends new (...args: infer A) => unknown
    ? Construtors<A, undefined, undefined, undefined>
    : Construtors<undefined, undefined, undefined, undefined>;

type AnyConstructors = Construtors<any, any, any, any>;

/**
 * Returns all constructors where the first paramter is assignable to given "scope"
 */
// tslint:disable-next-line:interface-over-type-literal
type FilterConstructorsByScope<T extends AnyConstructors, S> = {
    a: S extends T['a'][0] ? T['a'] : undefined;
    b: S extends T['b'][0] ? T['b'] : undefined;
    c: S extends T['c'][0] ? T['c'] : undefined;
    d: S extends T['d'][0] ? T['d'] : undefined;
};
/**
 * "flattens" the tuple into an union type
 */
type ConstructorUnion<T extends AnyConstructors> =
    | (T['a'] extends undefined ? never : T['a'])
    | (T['b'] extends undefined ? never : T['b'])
    | (T['c'] extends undefined ? never : T['c'])
    | (T['d'] extends undefined ? never : T['d']);

/**
 * Extract list of possible scopes - union of the first paramter
 * of all constructors, should it be string
 */
type ExtractScopes<T extends AnyConstructors> =
    | (T['a'][0] extends string ? T['a'][0] : never)
    | (T['b'][0] extends string ? T['b'][0] : never)
    | (T['c'][0] extends string ? T['c'][0] : never)
    | (T['d'][0] extends string ? T['d'][0] : never);

type GetConstructorsByScope<T, S> = ConstructorUnion<FilterConstructorsByScope<OverloadedConstructorsOf<T>, S>>;
type GetConstructors<T> = ConstructorUnion<OverloadedConstructorsOf<T>>;
type GetPossibleScopes<T> = ExtractScopes<OverloadedConstructorsOf<T>>;

export type ConvertType = (...params: unknown[]) => Swizzable;

export const ConvertType: {
    new (type: NodeTypeOption, cacheMap?: Map<unknown, ConstNode>): ConvertType;
};

type NodeArray<T extends NodeObjectOption[]> = { [index in keyof T]: NodeObject<T[index]> };
type NodeObjects<T> = { [key in keyof T]: T[key] extends NodeObjectOption ? NodeObject<T[key]> : T[key] };
type ConstructedNode<T> = T extends new (...args: any[]) => infer R ? (R extends Node ? R : never) : never;

export type NodeOrType = Node | NodeTypeOption;

export function getConstNodeType(value: NodeOrType): NodeTypeOption | null;
export function nodeObject<T extends NodeObjectOption>(obj: T): NodeObject<T>;
export function nodeObjects<T>(obj: T): NodeObjects<T>;

export function nodeArray<T extends NodeObjectOption[]>(obj: readonly [...T]): NodeArray<T>;

export function nodeProxy<T>(
    nodeClass: T,
): (...params: MakeObjectOptions<GetConstructors<T>>) => Swizzable<ConstructedNode<T>>;

export function nodeProxy<T, S extends GetPossibleScopes<T>>(
    nodeClass: T,
    scope: S,
): (...params: MakeObjectOptions<RemoveTail<GetConstructorsByScope<T, S>>>) => Swizzable<ConstructedNode<T>>;

export function nodeProxy<T, S extends GetPossibleScopes<T>>(
    nodeClass: T,
    scope: S,
    factor: NodeObjectOption,
): (...params: MakeObjectOptions<RemoveHeadAndTail<GetConstructorsByScope<T, S>>>) => Swizzable<ConstructedNode<T>>;

export function nodeImmutable<T>(
    nodeClass: T,
    ...params: MakeObjectOptions<GetConstructors<T>>
): Swizzable<ConstructedNode<T>>;

export class ShaderNode<T = {}, R extends Node = Node> {
    constructor(jsFunc: (inputs: NodeObjects<T>, builder: NodeBuilder) => NodeRepresentation);
    call: (
        inputs: { [key in keyof T]: T[key] extends NodeRepresentation ? Swizzable | Node : T[key] },
        builder?: NodeBuilder,
    ) => Swizzable<R>;
}

export const cacheMaps: {
    bool: Map<boolean, ConstNode>;
    uint: Map<number, ConstNode>;
    int: Map<number, ConstNode>;
    float: Map<number, ConstNode>;
};
