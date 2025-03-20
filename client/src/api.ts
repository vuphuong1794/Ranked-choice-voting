const baseApiUrl = `http://${import.meta.env.VITE_API_HOST}:${
  import.meta.env.VITE_API_PORT
}`;

// Định nghĩa giao diện APIError để biểu diễn lỗi từ API
interface APIError {
  messages: string[];
  statusCode?: number;
}

// Định nghĩa kiểu trả về của hàm makeRequest
interface MakeRequestResponse<T> {
  data: T | Record<string, never>; // Dữ liệu trả về từ API hoặc một object rỗng nếu có lỗi
  error?: APIError;
}

/**
 * Hàm gọi API chung với generic type T để linh hoạt xử lý nhiều kiểu dữ liệu
 * @param endpoint - Đường dẫn API (ví dụ: '/users')
 * @param reqInit - Tùy chọn cấu hình cho fetch API
 * @returns Kết quả từ API dưới dạng MakeRequestResponse<T>
 */
const makeRequest = async <T>(
  endpoint: string,
  reqInit?: RequestInit
): Promise<MakeRequestResponse<T>> => {
  try {
    const response = await fetch(`${baseApiUrl}${endpoint}`, {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      ...reqInit,
    });

    const responseJSON = await response.json();

    if (!response.ok) {
      return {
        data: {},
        error: responseJSON as APIError,
      };
    }

    return {
      data: responseJSON as T,
    };
  } catch (e) {
    const error =
      e instanceof Error
        ? {
            messages: [
              import.meta.env.MODE === 'development'
                ? e.message
                : 'Unknown error',
            ],
          }
        : {
            messages: ['Unknown error'],
          };

    return {
      data: {},
      error,
    };
  }
};

export { makeRequest };
