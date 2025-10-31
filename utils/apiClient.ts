
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const request = async <TResponse>(url: string, options: RequestInit): Promise<TResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        return await response.json() as TResponse;
    } catch (error) {
        if (error instanceof Error) {
            console.error('API Client Error:', error.message);
            throw error;
        }
        throw new Error('An unknown network error occurred.');
    }
};

export const apiClient = {
    get: async <TResponse>(url: string, options?: RequestInit): Promise<TResponse> => {
        return request<TResponse>(url, { ...options, method: 'GET' });
    },

    post: async <TRequestBody, TResponse>(url: string, body: TRequestBody, options?: RequestInit): Promise<TResponse> => {
        return request<TResponse>(url, {
            ...options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
            body: JSON.stringify(body),
        });
    },

    // Add other methods like put, delete as needed
};
