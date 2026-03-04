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
        transformResponse: [(data) => {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }]
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
        } else {
            axiosConfig.data = config.body;
        }
    }

    try {
        const response: AxiosResponse = await axios(axiosConfig);
        const endTime = Date.now();
        const time = endTime - startTime;

        // Calculate size
        const sizeInBytes = JSON.stringify(response.data).length + JSON.stringify(response.headers).length;
        const size = sizeInBytes > 1024
            ? (sizeInBytes / 1024).toFixed(2) + ' KB'
            : sizeInBytes + ' B';

        return {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
            data: response.data,
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
