    <script setup lang="ts">
    import { useProductsStore } from '@/@core/stores/products';
    import { useToastStore } from '@/@core/stores/toast.store';
    import { onMounted } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { VDataTable } from 'vuetify/labs/VDataTable';


    definePage({
        meta: {
            action: 'read',
            subject: 'SecondPage',
        },
    })
    const route = useRoute()
    const id = (route.params as { id: number }).id
    const store = useProductsStore()
    const isLoading = ref(false)
    const batches = ref([])
    const limit = ref(1)
    const page = ref(1)
    const total = ref(0)
    const router = useRouter()
    const productName = ref('')
    const deleteModal = ref(false)
    const deleteId = ref(0)

    const toastStore = useToastStore()
    const { t } = useI18n()

    const headers = [
        {
            title: 'pruchase price',
            key: 'purchase_price'
        },
        {
            title: 'selling price',
            key: 'selling_price'
        },
        {
            title: 'deliveryCost',
            key: 'deliveryCost'
        },
        {
            title: 'vatRate',
            key: 'vatRate'
        },
        {
            title: 'costPrice',
            key: 'costPrice'
        },
        {
            title: 'quantity',
            key: 'quantity'
        },
        {
            title: 'status',
            key: 'status'
        },
        {
            title: 'remaining_quantity',
            key: 'remaining_quantity'
        },
        // {
        //     title: 'activated_at',
        //     key: 'activated_at'
        // },
        // {
        //     title: 'depleted_at',
        //     key: 'depleted_at'
        // },
        {
            title: 'createdAt',
            key: 'createdAt'
        },
        {
            title: 'actions',
            key: 'actions',
            sortable: false
        }

    ]

    const refresh = (page: number) => {
        store.getBatchByProductId(Number(id), page).then((res) => {
            batches.value = res.data.data
            limit.value = res.data.meta.limit
            total.value = res.data.meta.total
        })
    }

    onMounted(() => {
        refresh(page.value)
        store.fetchProductOne(id).then((res) => {
            productName.value = res.data.name
        })

    })


    const deleteBatch = () => {
        if (!deleteId.value) return
        store.deleteBatch(deleteId.value).then(() => {
            refresh(page.value)
            toastStore.success(t('success'))
            deleteModal.value = false
        })
            .catch((error) => {
                toastStore.error(error.response._data.message)
            })
    }

</script>
    
<template>
    <div>
        <VCard class="mb-6 pa-5">
            <p @click="router.push(`/products`)" class="cursor-pointer">
                <VIcon icon="tabler-arrow-left" /> ortga
            </p>

            <VCardItem>
                <VCardTitle>{{ productName }} partiyasi</VCardTitle>
            </VCardItem>

            <div class="d-flex justify-end mb-4 ">


                <VBtn color="primary" prepend-icon="tabler-plus" @click="router.push(`/products/${id}/batches/create`)">
                    Add batch
                </VBtn>
            </div>
            <VDivider />

            <!-- 👉 Datatable  -->
            <VDataTable :headers="headers" :items="batches" class="text-no-wrap px-5 " :no-data-text="t('no_data')"
                :loading="isLoading" :loading-text="t('loading')" :items-per-page="store.limit"">

                <template #item.createdAt="{ item }">
                {{ new Date(item.createdAt).toLocaleString('uz-UZ') }}
</template>


<!-- Actions -->
<template #item.actions="{ item }">

    <IconBtn @click="router.push(`/products/batches/${item.id}`)">
        <VIcon icon="tabler-edit" color="success" />
    </IconBtn>

    <IconBtn @click="deleteModal = true, deleteId = item.id">
        <VIcon icon="tabler-trash" color="error" />
    </IconBtn>





</template>

<template #bottom>
    <VDivider />

    <div class="d-flex align-center justify-space-between flex-wrap gap-3 pa-5 pt-3">
        <p class="text-sm text-medium-emphasis mb-0">
        </p>

        <VPagination v-model="store.page" :length="Math.ceil(total / limit)"
            :total-visible="$vuetify.display.xs ? 1 : 5" @update:modelValue="refresh" />
    </div>
</template>
</VDataTable>


</VCard>

</div>

<DelateDialog v-model:delete-modal="deleteModal" @delete-element="deleteBatch" />
</template>

<style lang="scss" scoped></style>
