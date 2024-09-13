interface BaseOption<T> {
    /** `true` when the Option is Some */ readonly some: boolean;
    /** `true` when the Option is None */ readonly none: boolean;

    /**
     * Returns the contained `Some` value or a provided default.
     *
     *  (This is the `unwrap_or` in rust)
     */
    valueOr<T2>(val: T2): T | T2;

    /**
     * Calls `mapper` if the Option is `Some`, otherwise returns `None`.
     * This function can be used for control flow based on `Option` values.
     */
    andThen<T2>(mapper: ((val: T) => Option<T2>) | ((val: T) => T2)): Option<T2>;

    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained `Some` value,
     * leaving a `None` value untouched.
     *
     * This function can be used to compose the Options of two functions.
     */
    map<U>(mapper: (val: T) => U): Option<U>;
}

/**
 * Contains the None value
 */
export class NoneImpl implements BaseOption<never> {
    readonly some = false;
    readonly none = true;

    /**
     * Returns the contained `Some` value or a provided default.
     *
     *  (This is the `unwrap_or` in rust)
     */
    valueOr<T2>(val: T2): T2 {
        return val;
    }

    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained `Some` value,
     * leaving a `None` value untouched.
     *
     * This function can be used to compose the Options of two functions.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map(_mapper: unknown): None {
        return this;
    }

    /**
     * Calls `mapper` if the Option is `Some`, otherwise returns `None`.
     * This function can be used for control flow based on `Option` values.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    andThen(_op: unknown): None {
        return this;
    }
}

// Export None as a singleton, then freeze it so it can't be modified
export const None = new NoneImpl();
export type None = NoneImpl;
Object.freeze(None);

/**
 * Contains the success value
 */
export class SomeImpl<T> implements BaseOption<T> {
    static readonly EMPTY = new SomeImpl<void>(undefined);

    readonly some!: true;
    readonly none!: false;
    readonly val!: T;

    constructor(val: T) {
        if (!(this instanceof SomeImpl)) {
            return new SomeImpl(val);
        }

        this.some = true;
        this.none = false;
        this.val = val;
    }

    /**
     * Returns the contained `Some` value or a provided default.
     *
     *  (This is the `unwrap_or` in rust)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    valueOr(_val: unknown): T {
        return this.val;
    }

    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained `Some` value,
     * leaving a `None` value untouched.
     *
     * This function can be used to compose the Options of two functions.
     */
    map<T2>(mapper: (val: T) => T2): Some<T2> {
        return Some(mapper(this.val));
    }

    /**
     * Calls `mapper` if the Option is `Some`, otherwise returns `None`.
     * This function can be used for control flow based on `Option` values.
     */
    andThen<T2>(mapper: ((val: T) => Option<T2>) | ((val: T) => T2)): Option<T2> {
        const result = mapper(this.val);
        if (result instanceof SomeImpl || result instanceof NoneImpl) {
            return result;
        }
        return Some(result);
    }

    /**
     * Returns the contained `Some` value, but never throws.
     * Unlike `unwrap()`, this method doesn't throw and is only callable on an Some<T>
     *
     * Therefore, it can be used instead of `unwrap()` as a maintainability safeguard
     * that will fail to compile if the type of the Option is later changed to a None that can actually occur.
     *
     * (this is the `into_Some()` in rust)
     */
    safeValue(): T {
        return this.val;
    }
}

// This allows Some to be callable - possible because of the es5 compilation target
export const Some = <T>(val: T): SomeImpl<T> => new SomeImpl<T>(val);
export type Some<T> = SomeImpl<T>;

export type Option<T> = Some<T> | None;

export function isOption<T = unknown>(value: unknown): value is Option<T> {
    return value instanceof SomeImpl || value === None;
}
