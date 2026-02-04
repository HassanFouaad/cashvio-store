import { normalizePagination } from "../utils/pagination";
import { apiConfig } from "./config";
import {
  ApiException,
  ApiResponse,
  FetchOptions,
  getApiLocale,
  getApiStoreId,
  PaginatedResponse,
} from "./types";





/**
 * Base API client with error handling and timeout support
 */
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(
    baseUrl: string = apiConfig.baseUrl,
    timeout: number = apiConfig.timeout
  ) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
  }

  /**
   * Create fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiException(408, "Request timeout");
      }
      throw error;
    }
  }

  /**
   * Handle API response and extract data
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: string | undefined;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message || errorData.message || errorMessage;
          errorDetails = errorData.error?.code;
        } catch {
          // If JSON parsing fails, use default error message
        }
      }

      throw new ApiException(response.status, errorMessage, errorDetails);
    }

    if (!isJson) {
      throw new ApiException(500, "Expected JSON response from API");
    }

    const apiResponse: ApiResponse<T> = await response.json();
    return apiResponse.data;
  }

  /**
   * Handle paginated API response and transform to application format
   */
  private async handlePaginatedResponse<T>(
    response: Response
  ): Promise<PaginatedResponse<T>> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: string | undefined;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message || errorData.message || errorMessage;
          errorDetails = errorData.error?.code;
        } catch {
          // If JSON parsing fails, use default error message
        }
      }

      throw new ApiException(response.status, errorMessage, errorDetails);
    }

    if (!isJson) {
      throw new ApiException(500, "Expected JSON response from API");
    }

    const apiResponse: ApiResponse<T[]> = await response.json();

    // Verify pagination meta exists
    if (!apiResponse.meta.pagination) {
      throw new ApiException(
        500,
        "Expected paginated response but pagination meta is missing"
      );
    }

    // Transform to application format and normalize pagination values to numbers
    return {
      items: apiResponse.data,
      pagination: normalizePagination(apiResponse.meta.pagination),
    };
  }

  /**
   * Get headers with Accept-Language and X-Store-Id based on current context
   */
  private getHeaders(additionalHeaders?: HeadersInit): HeadersInit {
    const locale = getApiLocale();
    const storeId = getApiStoreId();

    const headers: Record<string, string> = {
      ...apiConfig.headers,
      "Accept-Language": locale,
    };

    // Add store ID header if available
    if (storeId) {
      headers["X-Store-Id"] = storeId;
    }

    return {
      ...headers,
      ...additionalHeaders,
    };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: "GET",
      headers: this.getHeaders(options?.headers),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: FetchOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: "POST",
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * POST request that expects no content (204)
   * Used for fire-and-forget operations like tracking
   */
  async postNoContent<D = unknown>(
    endpoint: string,
    data?: D,
    options?: FetchOptions
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: "POST",
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok && response.status !== 204) {
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default error message
        }
      }

      throw new ApiException(response.status, errorMessage);
    }
  }

  /**
   * PUT request
   */
  async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: FetchOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: "PUT",
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: "DELETE",
      headers: this.getHeaders(options?.headers),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * GET paginated request
   * Use this for endpoints that return paginated data
   * Backend format: { success, data: T[], meta: { timestamp, pagination: {...} } }
   * Transforms to: { items: T[], pagination: {...} }
   */
  async getPaginated<T>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<PaginatedResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: "GET",
      headers: this.getHeaders(options?.headers),
    });
    return this.handlePaginatedResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };
