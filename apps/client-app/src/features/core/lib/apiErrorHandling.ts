import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: string[];
  errorCode?: string;
}

export const extractError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const responseData = axiosError.response.data as any;
      
      if (responseData && responseData.error && responseData.error.message) {
        return {
          message: responseData.error.message,
          statusCode: axiosError.response.status,
          errorCode: responseData.error.code,
        };
      }
      
      if (axiosError.response.status === 429 && responseData && responseData.error) {
        return {
          message: responseData.error,
          statusCode: axiosError.response.status,
        };
      } else if (responseData && responseData.message) {
        return {
          message: responseData.message,
          statusCode: axiosError.response.status,
        };
      } else if (axiosError.response.statusText) {
        return {
          message: `Request failed with status ${axiosError.response.status}: ${axiosError.response.statusText}`,
          statusCode: axiosError.response.status,
        };
      } else {
        return {
          message: `Request failed with status ${axiosError.response.status}`,
          statusCode: axiosError.response.status,
        };
      }
    } else if (axiosError.message) {
      return {
        message: axiosError.message,
      };
    } else {
      return {
        message: "An unexpected error occurred.",
      };
    }
  } else if (error instanceof Error) {
    return {
      message: error.message,
    };
  } else {
    return {
      message: "An unexpected error occurred.",
    };
  }
};
