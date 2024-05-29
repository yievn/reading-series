const defaultKey = 'default';

export function memoize(fn: Function) {
  const cache = {};
  return (...args) => {
    const n = args[0] || defaultKey;
    // 在缓存中直接返回
    if (n in cache) {
      return cache[n];
    } else {
      const result = fn(n === defaultKey ? undefined : n);
      cache[n] = result;
      return result;
    }
  };
}

