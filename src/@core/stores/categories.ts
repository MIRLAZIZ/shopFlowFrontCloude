import { Category } from "@/interface/categories";
import { $api } from "@/utils/api";
import { defineStore } from "pinia";


export const useCategoriesStore = defineStore("categories", {
    state: () => ({
        categories: [] as Category[],
    }),
    actions: {
        async fetchcategories() {
            const response = await $api("/categories")
            this.categories = response.data
        },

        async createCategory(data: Omit<Category, "id">) {
            const response = await $api("/categories", {
                method: "post",
                body: data,
            })
            return response
        },
        async deleteCategory(id: number) {
            const response = await $api(`/categories/${id}`, {
                method: "delete",
            })
            return response
        },
        async updateCategory(id: number, data: Omit<Category, "id">) {
            const response = await $api(`/categories/${id}`, {
                method: "put",
                body: data,
            })
            return response
        },

    }
});
