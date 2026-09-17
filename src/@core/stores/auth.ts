import { LoginForm } from '@/type/auth'
import { $api } from '@/utils/api'
import { defineStore } from 'pinia'



export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: {}
    }),
    actions: {
        async loginUser(data: LoginForm) {
            try {
                const response = await $api('/auth/login', {
                    method: 'post',
                    body: data

                })
                return response
            } catch (error) {
                throw error
            }

        }
    }
})
