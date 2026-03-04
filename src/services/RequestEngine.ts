import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

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

    // Clean up headers and params
    const headers = { ...config.headers };
    const params = { ...config.params };

    const axiosConfig: AxiosRequestConfig = {
        method: config.method,
        url: config.url,
        headers,
        params,
        validateStatus: () => true, // Don't throw for 4xx/5xx
        responseType: 'arraybuffer' // Get raw bytes for all requests to handle binary
    };

    // Handle body
    if (config.body && config.method !== 'GET') {
        if (config.bodyType === 'json') {
            axiosConfig.data = config.body;
            axiosConfig.headers!['Content-Type'] = 'application/json';
        } else if (config.bodyType === 'form-data') {
            const formData = new FormData();
            Object.entries(config.body as Record<string, any>).forEach(([key, value]) => {
                formData.append(key, value);
            });
            axiosConfig.data = formData;
        } else if (config.bodyType === 'x-www-form-urlencoded') {
            const searchParams = new URLSearchParams();
            Object.entries(config.body as Record<string, any>).forEach(([key, value]) => {
                searchParams.append(key, value);
            });
            axiosConfig.data = searchParams;
        } else if (config.bodyType === 'binary' && config.body instanceof File) {
            axiosConfig.data = config.body;
            axiosConfig.headers!['Content-Type'] = config.body.type || 'application/octet-stream';
        } else {
            axiosConfig.data = config.body;
        }
    }

    try {
        const response: AxiosResponse = await axios(axiosConfig);
        const endTime = Date.now();
        const time = endTime - startTime;

        const contentType = response.headers['content-type'] || '';
        let data = response.data;

        // Try to parse JSON if it looks like text
        if (contentType.includes('application/json') || contentType.includes('text/')) {
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(data);
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
        } else if (contentType.includes('image/')) {
            // Convert arraybuffer to base64 for images
            const base64 = btoa(new Uint8Array(data).reduce((d, byte) => d + String.fromCharCode(byte), ''));
            data = `data:${contentType};base64,${base64}`;
        }

        // Calculate size from arraybuffer length
        const sizeInBytes = response.data.byteLength;
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
        const endTime = Date.now();
        return {
            status: 0,
            statusText: error.message || 'Error',
            headers: {},
            data: error.message || 'Error occurred while sending request',
            time: endTime - startTime,
            size: '0 B'
        };
    }
};
