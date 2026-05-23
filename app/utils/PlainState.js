const hasOwn = Object.prototype.hasOwnProperty;

const isPlainObject = value => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

export const get = (value, key, notSetValue) => {
    if (value == null) {
        return notSetValue;
    }
    if (value instanceof Map) {
        return value.has(key) ? value.get(key) : notSetValue;
    }
    if (Array.isArray(value)) {
        return key in value ? value[key] : notSetValue;
    }
    return hasOwn.call(value, key) ? value[key] : notSetValue;
};

export const has = (value, key) => get(value, key) !== undefined;

export const getIn = (value, path, notSetValue) => {
    let current = value;
    for (const key of path) {
        current = get(current, key, notSetValue);
        if (current === notSetValue) {
            return notSetValue;
        }
    }
    return current === undefined ? notSetValue : current;
};

export const hasIn = (value, path) => getIn(value, path) !== undefined;

export const toPlain = value => {
    if (value instanceof Map) {
        return Array.from(value.entries()).reduce((result, [key, item]) => {
            result[key] = toPlain(item);
            return result;
        }, {});
    }
    if (value instanceof Set) {
        return Array.from(value).map(toPlain);
    }
    if (Array.isArray(value)) {
        return value.map(toPlain);
    }
    if (isPlainObject(value)) {
        return Object.keys(value).reduce((result, key) => {
            result[key] = toPlain(value[key]);
            return result;
        }, {});
    }
    return value;
};

export const toArray = value => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    if (value instanceof Map || value instanceof Set) {
        return Array.from(value.values());
    }
    return Object.values(value);
};

export const toSet = value =>
    value instanceof Set ? new Set(value) : new Set(toArray(value));

export const count = value =>
    value == null ? 0 : typeof value.size === 'number' ? value.size : toArray(value).length;

export const deepMerge = (target, source) => {
    if (Array.isArray(source)) {
        return source.slice();
    }
    if (!isPlainObject(source)) {
        return source;
    }

    const result = {
        ...(isPlainObject(target)
            ? target
            : {}),
    };

    for (const [key, value] of Object.entries(source)) {
        if (isPlainObject(value)) {
            result[key] = deepMerge(result[key], value);
        } else if (Array.isArray(value)) {
            result[key] = value.slice();
        } else {
            result[key] = value;
        }
    }

    return result;
};

export const setIn = (target, path, value) => {
    let current = target;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] == null) {
            current[key] = typeof path[i + 1] === 'number' ? [] : {};
        }
        current = current[key];
    }
    current[path[path.length - 1]] = value;
    return target;
};

export const removeIn = (target, path) => {
    const last = path[path.length - 1];
    const parent = getIn(target, path.slice(0, -1));
    if (parent == null) {
        return target;
    }
    if (Array.isArray(parent)) {
        parent.splice(last, 1);
    } else {
        delete parent[last];
    }
    return target;
};

export const updateIn = (target, path, notSetValue, updater) => {
    if (typeof notSetValue === 'function') {
        updater = notSetValue;
        notSetValue = undefined;
    }

    const current = getIn(target, path, notSetValue);
    return setIn(target, path, updater(current));
};
