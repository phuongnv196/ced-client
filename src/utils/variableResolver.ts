export const resolveVariables = (text: string, variables: Record<string, string>): string => {
    if (!text) return text;

    // Replace {{variable_name}} with values from the variables record
    return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return variables[trimmedKey] !== undefined ? variables[trimmedKey] : match;
    });
};

export const resolveObjectVariables = <T>(obj: T, variables: Record<string, string>): T => {
    if (!obj) return obj;

    if (typeof obj === 'string') {
        return resolveVariables(obj, variables) as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => resolveObjectVariables(item, variables)) as unknown as T;
    }

    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            newObj[key] = resolveObjectVariables(value, variables);
        }
        return newObj as T;
    }

    return obj;
};
