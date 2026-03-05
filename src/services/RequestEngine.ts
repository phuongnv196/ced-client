import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

export interface RequestConfig {
    method: string;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    body: any;
    bodyType: string;
}

export interface ResponseData {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    time: number;
    size: string;
}

export const sendRequest = async (config: RequestConfig): Promise<ResponseData> => {
    const startTime = Date.now();

    const headers = { ...config.headers };
    const params = { ...config.params };

    const axiosConfig: AxiosRequestConfig = {
        method: config.method,
        url: config.url,
        headers,
        params,
        validateStatus: () => true,
        responseType: 'arraybuffer'
    };

    // Body mapping - prepare payloads for potentially binary transmission
    let ipcBody = config.body;
    if (config.body && config.method !== 'GET') {
        if (config.bodyType === 'form-data') {
            const fdObj: Record<string, any> = {};
            for (const [key, value] of Object.entries(config.body as Record<string, any>)) {
                if (value instanceof File) {
                    const buf = await value.arrayBuffer();
                    fdObj[key] = { buffer: buf, fileName: value.name, mime: value.type };
                } else {
                    fdObj[key] = value;
                }
            }
            ipcBody = fdObj;
        } else if (config.bodyType === 'binary' && config.body instanceof File) {
            const buf = await config.body.arrayBuffer();
            ipcBody = { buffer: buf, name: config.body.name, mime: config.body.type };
        }
    }

    const ipcConfig = {
        method: config.method,
        url: config.url,
        headers,
        params,
        body: ipcBody,
        bodyType: config.bodyType
    };

    try {
        let response: any;
        const hasElectron = typeof window !== 'undefined' && !!(window as any).electron;

        if (hasElectron) {
            // HIGH PERFORMANCE / LOW RESTRICTION path: Native Node IPC
            const nativeResponse = await (window as any).electron.invoke('send-native-request', ipcConfig);
            if (!nativeResponse.success) {
                throw new Error(nativeResponse.error);
            }
            response = {
                status: nativeResponse.status,
                statusText: nativeResponse.statusText,
                headers: nativeResponse.headers,
                data: nativeResponse.data // Native Buffer (Electron handles this)
            };
        } else {
            // BROWSER FALLBACK: Standard Axios (will hit CORS restrictions)
            if (config.body && config.method !== 'GET') {
                if (config.bodyType === 'json') {
                    axiosConfig.data = config.body;
                } else if (config.bodyType === 'form-data') {
                    const formData = new FormData();
                    Object.entries(config.body as Record<string, any>).forEach(([key, value]) => {
                        formData.append(key, value);
                    });
                    axiosConfig.data = formData;
                } else if (config.bodyType === 'x-www-form-urlencoded') {
                    const sp = new URLSearchParams(config.body);
                    axiosConfig.data = sp;
                } else if (config.bodyType === 'binary' && config.body instanceof File) {
                    axiosConfig.data = config.body;
                } else {
                    axiosConfig.data = config.body;
                }
            }
            response = await axios(axiosConfig);
        }

        const endTime = Date.now();
        const time = endTime - startTime;

        const contentType = (response.headers['content-type'] || '').toLowerCase();
        let data = response.data;

        // Try to decode text/json automatically if it's an ArrayBuffer/Buffer (Uint8Array in renderer)
        if (data && (data instanceof ArrayBuffer || ArrayBuffer.isView(data))) {
            if (contentType.includes('application/json') || contentType.includes('text/')) {
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(data);
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }
            } else if (contentType.includes('image/')) {
                // Inline images for easy previewing
                const bytes = new Uint8Array(data as any);
                const base64 = btoa(bytes.reduce((d, byte) => d + String.fromCharCode(byte), ''));
                data = `data:${contentType};base64,${base64}`;
            }
        }

        const sizeInBytes = response.data?.byteLength || response.data?.length || 0;
        const size = sizeInBytes > 1024 * 1024
            ? (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB'
            : sizeInBytes > 1024
                ? (sizeInBytes / 1024).toFixed(2) + ' KB'
                : sizeInBytes + ' B';

        return {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
            data,
            time,
            size
        };

    } catch (error: any) {
        return {
            status: 0,
            statusText: 'Error',
            headers: {},
            data: error.message || 'Network Error',
            time: Date.now() - startTime,
            size: '0 B'
        };
    }
};
