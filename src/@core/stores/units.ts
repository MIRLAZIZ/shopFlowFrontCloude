import { Unit } from "@/interface/unit.interface";
import { $api } from "@/utils/api";
import { defineStore } from "pinia";


export const useUnitsStore = defineStore("units", {
    state: () => ({
        units: [] as Unit[],
    }),
    actions: {
        async fetchUnits() {
            const response = await $api("/units")
            this.units = response.data
        },

        async createUnit(data: Omit<Unit, "id">) {
            const response = await $api("/units", {
                method: "post",
                body: data,
            })
            return response
        },
        async deleteUnit(id: number) {
            const response = await $api(`/units/${id}`, {
                method: "delete",
            })
            return response
        },
        async updateUnit(id: number, data: Omit<Unit, "id">) {
            const response = await $api(`/units/${id}`, {
                method: "put",
                body: data,
            })
            return response
        },

    }
});
