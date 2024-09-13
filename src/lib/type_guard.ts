export function typeGuard<T>(_value: unknown, isMatched: boolean): _value is T {
    return isMatched;
}
