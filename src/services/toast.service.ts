import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export const ToastService = {
    success(message: string) {
        toast.success(message, {
            autoClose: 3000,
            theme: 'colored',
        });
    },
    error(message: string) {
        toast.error(message, {
            autoClose: 3000,
            theme: 'colored',
        });
    },
};
