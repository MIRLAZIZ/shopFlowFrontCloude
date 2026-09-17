import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export const useToastStore = defineStore("toast", {
    actions: {


        success(message: string) {
            toast.success(message, {
                autoClose: 3000,
                theme: 'colored',
            });
        },
        error(message: string) {
            toast.error(message, {
                autoClose: 5000,
                theme: 'colored',
            });
        },

        showErrors(errors: Record<string, string>) {


            Object.values(errors).forEach((message) => {
                toast.error(message, {
                    autoClose: 5000,
                    theme: 'colored',
                });
            });
        }




    }
}

)
