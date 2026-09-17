export type ApiResponse<T> = {
    success: boolean;
    data: {
        data: T[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        }
    };
    message: string;
    timestamp: string;
};
