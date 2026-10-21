export function buildJavaScriptProgram(code: string, tests: string): string {
  return `(async () => {
  const __startedAt = Date.now();
  const __testResults = [];
  const __stdout = [];
  const __stderr = [];
  const __tests = [];
  const __format = (value) => {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch { return String(value); }
  };
  const console = {
    log: (...values) => __stdout.push(values.map(__format).join(' ')),
    error: (...values) => __stderr.push(values.map(__format).join(' ')),
  };
  const test = (name, fn) => __tests.push({ name: String(name), fn });
  const __fail = (message) => { throw new Error(message); };
  const __deepEqual = (left, right, seen = new WeakMap()) => {
    if (Object.is(left, right)) return true;
    if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;
    if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false;
    const prior = seen.get(left);
    if (prior === right) return true;
    seen.set(left, right);
    const leftKeys = Reflect.ownKeys(left);
    const rightKeys = Reflect.ownKeys(right);
    return leftKeys.length === rightKeys.length && leftKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(right, key) && __deepEqual(left[key], right[key], seen));
  };
  const assert = {
    ok(value, message = 'Expected a truthy value') {
      if (!value) __fail(message);
    },
    equal(actual, expected, message) {
      if (!Object.is(actual, expected)) __fail(message || 'Expected ' + __format(actual) + ' to equal ' + __format(expected));
    },
    notEqual(actual, expected, message) {
      if (Object.is(actual, expected)) __fail(message || 'Expected values not to be equal');
    },
    deepEqual(actual, expected, message) {
      if (!__deepEqual(actual, expected)) __fail(message || 'Expected ' + __format(actual) + ' to deeply equal ' + __format(expected));
    },
    throws(fn, expected) {
      let thrown;
      try { fn(); } catch (error) { thrown = error; }
      if (!thrown) __fail('Expected function to throw');
      if (expected instanceof RegExp && !expected.test(String(thrown.message || thrown))) {
        __fail('Thrown error did not match ' + expected);
      }
      if (typeof expected === 'string' && !String(thrown.message || thrown).includes(expected)) {
        __fail('Thrown error did not include ' + expected);
      }
      return thrown;
    },
  };
  let __result;
  try {
    ${code}
    ${tests}
    for (const __entry of __tests) {
      try {
        await __entry.fn();
        __testResults.push({ name: __entry.name, passed: true });
      } catch (__error) {
        __testResults.push({ name: __entry.name, passed: false, message: String(__error && (__error.message || __error)) });
      }
    }
    const __passed = __testResults.length > 0 && __testResults.every((result) => result.passed);
    __result = {
      status: __passed ? 'passed' : 'failed',
      tests: __testResults,
      stdout: __stdout.join('\\n'),
      stderr: __stderr.join('\\n'),
      durationMs: Date.now() - __startedAt,
    };
  } catch (__error) {
    __result = {
      status: 'error',
      tests: __testResults,
      stdout: __stdout.join('\\n'),
      stderr: [__stderr.join('\\n'), String(__error && (__error.stack || __error.message || __error))].filter(Boolean).join('\\n'),
      durationMs: Date.now() - __startedAt,
    };
  }
  globalThis.postMessage(__result);
})();`;
}