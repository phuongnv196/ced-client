import type { ResponseData } from '../services/RequestEngine';

export interface ScriptContext {
    // Variables
    variables: Record<string, string>;
    // Mutated headers (pre-request can add/remove headers)
    headers: Record<string, string>;
    // Response (only available in post-response)
    response?: ResponseData | null;
    // Test results
    testResults: Array<{ name: string; passed: boolean; error?: string }>;
    // Console logs captured from script
    logs: string[];
}

/**
 * Execute a script string in a sandboxed context.
 * Returns the mutated context (variables, headers, test results).
 */
export const executeScript = (
    scriptCode: string,
    context: ScriptContext
): ScriptContext => {
    if (!scriptCode || scriptCode.trim() === '') return context;

    const mutableVars = { ...context.variables };
    const mutableHeaders = { ...context.headers };
    const testResults = [...context.testResults];
    const logs: string[] = [...context.logs];

    // Build the pm/cedClient sandbox object
    const pmObject = {
        globals: {
            get: (key: string) => mutableVars[key],
            set: (key: string, val: any) => { mutableVars[key] = String(val); },
        },
        environment: {
            get: (key: string) => mutableVars[key],
            set: (key: string, val: any) => { mutableVars[key] = String(val); },
        },
        variables: {
            get: (key: string) => mutableVars[key],
            set: (key: string, val: any) => { mutableVars[key] = String(val); },
        },
        request: {
            headers: {
                add: (header: { key: string; value: string }) => {
                    mutableHeaders[header.key] = header.value;
                },
                remove: (key: string) => {
                    delete mutableHeaders[key];
                },
                get: (key: string) => mutableHeaders[key],
            },
            method: context.headers['__method__'] || 'GET',
            url: {
                get: () => mutableHeaders['__url__'] || '',
                set: (url: string) => { mutableHeaders['__url__'] = url; }
            },
            body: null,
        },
        // Response object (post-response only)
        response: context.response ? {
            code: context.response.status,
            status: context.response.statusText,
            text: () => {
                const d = context.response!.data;
                return typeof d === 'string' ? d : JSON.stringify(d);
            },
            json: () => {
                const d = context.response!.data;
                if (typeof d === 'object') return d;
                try { return JSON.parse(d); } catch { return null; }
            },
            headers: {
                get: (key: string) => (context.response!.headers as any)[key],
            },
            to: {
                have: {
                    status: (expectedCode: number) => {
                        if (context.response!.status !== expectedCode) {
                            throw new Error(`Expected status ${expectedCode} but got ${context.response!.status}`);
                        }
                    }
                }
            },
            responseTime: context.response.time,
        } : null,
        // Test runner
        test: (name: string, fn: () => void) => {
            try {
                fn();
                testResults.push({ name, passed: true });
            } catch (e: any) {
                testResults.push({ name, passed: false, error: e.message });
            }
        },
        // Chai-like expect
        expect: (val: any) => {
            const assertions = {
                to: {} as any,
                equal: (expected: any) => {
                    if (val !== expected) throw new Error(`Expected ${val} to equal ${expected}`);
                    return assertions;
                },
                eql: (expected: any) => {
                    if (JSON.stringify(val) !== JSON.stringify(expected))
                        throw new Error(`Expected ${JSON.stringify(val)} to eql ${JSON.stringify(expected)}`);
                    return assertions;
                },
                include: (str: string) => {
                    if (!String(val).includes(str)) throw new Error(`Expected "${val}" to include "${str}"`);
                    return assertions;
                },
                be: {
                    ok: () => { if (!val) throw new Error(`Expected truthy value`); return assertions; },
                    a: (type: string) => {
                        if (typeof val !== type) throw new Error(`Expected ${typeof val} to be ${type}`);
                        return assertions;
                    }
                }
            };
            assertions.to = { ...assertions, have: { status: assertions.equal } };
            return assertions;
        },
    };

    // Capture console.log
    const fakeConsole = {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
    };

    try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('pm', 'cedClient', 'console', scriptCode);
        fn(pmObject, pmObject, fakeConsole);
    } catch (e: any) {
        logs.push(`[Script Error] ${e.message}`);
    }

    return {
        variables: mutableVars,
        headers: mutableHeaders,
        response: context.response,
        testResults,
        logs,
    };
};
