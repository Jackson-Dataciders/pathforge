export function buildPythonHarness(code: string, tests: string): string {
  return `import contextlib
import io
import json
import sys

__code = ${JSON.stringify(code)}
__tests_source = ${JSON.stringify(tests)}
__stdout = io.StringIO()
__stderr = io.StringIO()
__namespace = {"__name__": "__main__"}
__results = []
__error = None

with contextlib.redirect_stdout(__stdout), contextlib.redirect_stderr(__stderr):
    try:
        exec(__code, __namespace)
        exec(__tests_source, __namespace)
        __test_functions = [
            (name, value)
            for name, value in __namespace.items()
            if name.startswith("test_") and callable(value)
        ]
        if not __test_functions:
            raise RuntimeError("No test_* functions were defined.")
        for __name, __function in __test_functions:
            try:
                __function()
                __results.append({"name": __name, "passed": True})
            except AssertionError as __exception:
                __message = str(__exception) or repr(__exception)
                __results.append({"name": __name, "passed": False, "message": __message})
            except Exception as __exception:
                __message = type(__exception).__name__ + ": " + str(__exception)
                __results.append({"name": __name, "passed": False, "message": __message})
    except Exception as __exception:
        __error = type(__exception).__name__ + ": " + str(__exception)

json.dumps({
    "tests": __results,
    "stdout": __stdout.getvalue(),
    "stderr": __stderr.getvalue(),
    "error": __error,
})`;
}