import { Product } from '@/interface/products.interface';
import { ApiResponse } from '@/type/api-response.type';
import { defineStore } from 'pinia';

export const useProductsStore = defineStore('products', {
    state: () => ({
        products: [] as Product[],
        page: 1,
        total: 0,
        limit: 12,

        stockFilters: [
            {
                name: 'Omborda mavjud',
                value: 'IN_STOCK',
            },
            {
                name: 'Tugagan',
                value: 'OUT_OF_STOCK',
            },
            {
                name: 'Kam qolgan',
                value: 'LOW_STOCK',

            }
        ],
        priceMode: [
            { name: 'Yaxona narx', value: 'UNIFORM' },
            { name: 'Partiya bo\'yicha narx', value: 'FIFO' },
        ]

    }),

    actions: {
        async fetchProducts(page: number) {
            const response: ApiResponse<Product> = await $api(`products/?page=${page}`);


            this.products = response.data.data;

            this.total = response.data.meta.total
            this.limit = response.data.meta.limit

        },


        // ______________________________Products_____________________________________

        async createProduct(data: any) {
            return await $api("/products", {
                method: "post",
                body: data,
            });
        },

        async deleteProduct(id: number) {
            return await $api(`/products/${id}`, {
                method: "delete",
            });
        },
        async updataProduct(id: number, data: any) {
            return await $api(`/products/${id}`, {
                method: "put",
                body: data,
            });
        },

        async fetchOneProduct(id: number) {
            return await $api(`/products/${id}`);
        },
        async searchProduct({ name, barcode, quickCode }: {
            name?: string,
            barcode?: string,
            quickCode?: string
        } = {}) {
            const params = new URLSearchParams();

            if (name) params.append('name', name);
            if (barcode) params.append('barcode', barcode);
            if (quickCode) params.append('quickCode', quickCode);

            const query = params.toString();
            return await $api(`/products/search${query ? `?${query}` : ''}`);
        },
        async fetchProductOne(id: number) {
            return await $api(`/products/${id}`);
        },



        // ______________________________Batch_____________________________________
        async createBatch(data: any) {

            return await $api("/products/batch", {
                method: "post",
                body: data,
            });
        },

        // get batch by product id and page
        async getBatchByProductId(id: number, page: number) {
            return await $api(`/products/${id}/batches?page=${page}`);
        },

        async fetchBatchOne(id: number) {
            return await $api(`/products/batch/${id}`);
        },

        // update batch
        async updateBatch(id: number, data: any) {
            return await $api(`/products/batch/${id}`, {
                method: "put",
                body: data,
            });
        },
        async deleteBatch(id: number) {
            return await $api(`/products/batch/delete/${id}`, {
                method: "delete",
            });
        },

        // __________________felter and serach_____________________________________

        //      barcode?: string;
        // name?: string;
        // quickCode?: string;
        // categoryId?: number;
        // stock?: string;
        // status?: string;

        async fetchFilterAndSearch(data: any) {
            const params = new URLSearchParams();

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    params.append(key, String(value));
                }
            });

            return await $api(`/products/search?${params.toString()}`).then((res) => {
                this.products = res.data
                console.log(res);

            });
        }





    }
});
