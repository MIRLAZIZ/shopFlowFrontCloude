import { ResponseUser } from '@/interface/users.interface';
import { defineStore } from 'pinia';

export const useUsersStore = defineStore('users', {
    state: () => ({
        users: [] as ResponseUser[],
        limit: 12,
        page: 1,
        total: 0



    }),

    actions: {

        async fetchUsers() {
            const response = await $api("/users")
            this.users = response.data.data
            this.total = response.data.meta.total
            this.limit = response.data.meta.limit
        },

        async createUser(data: any) {
            return await $api("/users", {
                method: "post",
                body: data,
            })
        },

        async updateUser(id: number, data: any) {
            return await $api(`/users/${id}`, {
                method: "put",
                body: data,
            })
        },


        //delete
        async deleteUser(id: number) {
            const response = await $api(`/users/${id}`, {
                method: "delete",
            })
            return response
        },
        async fetchOneUser(id: number) {
            return await $api(`/users/${id}`)
        },

        async changePassword(id: number, data: any) {
            return await $api(`/users/change-password/${id}`, {
                method: "put",
                body: data,
            })
        },
        // :id/subscription/extend

        async subscriptonManually(id: number, data: any) {
            return await $api(`/users/${id}/subscription/extend`, {
                method: "put",
                body: data,
            })

        },
        async sendTelegramMassageUser(username: string, message: string) {
            return await $api(`telegram/send-user`, {
                method: "post",
                body: { username, message },
            })

        }

    }
});
