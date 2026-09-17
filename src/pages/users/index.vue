<script lang="ts" setup>
import { useToastStore } from '@/@core/stores/toast.store';
import { useUsersStore } from '@/@core/stores/users';
import ChangePasswordDialog from '@/views/users/changePasswordDialog.vue';
import ExtendSubscriptionDialog from '@/views/users/ExtendSubscriptionDialog.vue';
import SendTelgramMassage from '@/views/users/SendTelgramMassage.vue';
import { useRouter } from 'vue-router';
import { VDataTable } from 'vuetify/labs/VDataTable';
definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})



function getExpiryColor(expiryDate: string) {
    const today = new Date()
    const expiry = new Date(expiryDate)

    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const expiryUTC = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate())

    const diffDays = Math.round((expiryUTC - todayUTC) / 86400000)

    if (diffDays < 0) return 'text-error'
    if (diffDays <= 3) return 'text-warning'
    return 'text-success'
}





const getStatusInfo = (status: string) => {

    if (status === 'trial') return {
        label: 'Sinov muddati',
        color: 'info'
    }
    if (status === 'active') return { label: 'Active', color: 'success' }
    return { label: 'Expired', color: 'error' }

}

const { t } = useI18n()
const router = useRouter()
const toasStore = useToastStore()
// const categoryisStoere = useCategoriesStore()
const isDialogVisible = ref(false)
const itemId = ref<number | null>(null)
const extendDialogVisible = ref(false)
const sendDialogVisible = ref(false)
const userName = ref(null as string | null)




const headers = [
    { title: 'Ism familya', key: 'fullName' },
    { title: 'brand', key: 'brandName', sortable: false },
    { title: 'username', key: 'username', sortable: false },
    { title: 'phone', key: 'phone', sortable: false },
    { title: 'Status', key: 'subscriptionStatus', sortable: false },
    { title: 'expiryDate', key: 'expiryDate', sortable: false },
    { title: 'role', key: 'role', sortable: false },
    { title: 'createdAt', key: 'createdAt', sortable: false },
    { title: 'balance', key: 'balance', sortable: false },
    { title: 'actions', key: 'actions', sortable: false },


]


const filterAndSearch = reactive({
    categoryId: null,
    status: null,
    stock: null,
    name: null,
    barcode: null,
    quickCode: null

})


const store = useUsersStore()


const loading = ref(false)


const refresh = () => {
    store.fetchUsers()
        .then(() => { loading.value = false })
        .catch((error) => {
            toasStore.error(error.response._data.message)
            loading.value = false
        })


}



onMounted(() => {
    refresh()
    // categoryisStoere.fetchcategories()

})





// const search = useDebounceFn(async () => {
//     const hasFilter = Object.values(filterAndSearch).some(
//         value => value !== undefined && value !== null && value !== ""
//     );

//     if (hasFilter) {
//         await store.fetchFilterAndSearch(filterAndSearch);
//     } else {
//         await store.fetchProducts(store.page);
//     }
// }, 500);

// watch(filterAndSearch, search, {
//     deep: true,
// });



</script>



<template>
    <div>
        <pre>
      <!-- {{ store.products }} -->
    </pre>
        <!-- 👉 products -->
        <VCard class="mb-6 " title="clients">

            <template #append>
                <VBtn color="primary" prepend-icon="tabler-plus" @click="router.push('/users/create')">
                    Add user
                </VBtn>
            </template>


            <VDivider />


            <!-- <VCardText>
                <h3>izlash</h3>
                <VRow>

                    <VCol cols="12" sm="4">
                        <AppTextField v-model="filterAndSearch.name" placeholder="nomi" density="compact" class="me-3"
                            clearable />


                    </VCol>
                    <VCol cols="12" sm="4">
                        <AppTextField v-model="filterAndSearch.barcode" placeholder="barcode" density="compact"
                            class="me-3" clearable />


                    </VCol>

                    <VCol cols="12" sm="4">
                        <AppTextField v-model="filterAndSearch.quickCode" placeholder="quick_code" density="compact"
                            class="me-3" clearable />


                    </VCol>

                </VRow>





            </VCardText> -->





            <!-- 👉 Datatable  -->
            <VDataTable :headers="headers" :items="store.users" class="text-no-wrap  " :no-data-text="t('no_data')"
                :loading="loading" :loading-text="t('loading')" :items-per-page="store.limit"">



        <template #item.expiryDate="{ item }">
                <span :class="getExpiryColor(item.expiryDate)">
                    {{ item.expiryDate.split('T')[0] }}
                </span>
</template>


<template #item.createdAt="{ item }">
    {{ item.createdAt.split('T')[0] }}
</template>

<template #item.balance="{ item }">


    <span :class="Number(item.balance) < 0 ? 'text-error' : 'text-success'">
        {{ Number(item.balance).toLocaleString() }} so'm
    </span>
</template>

<template #item.subscriptionStatus="{ item }">

    <VChip :color="getStatusInfo(item.subscriptionStatus).color" size="small">
        {{ getStatusInfo(item.subscriptionStatus).label }}
    </VChip>
</template>





<!-- Actions -->
<template #item.actions="{ item }">





    <IconBtn @click="router.push(`/users/edit/${item.id}`)">
        <VIcon icon="tabler-edit" color="success" />
    </IconBtn>

    <IconBtn @click="isDialogVisible = true, itemId = item.id">
        <VIcon icon="tabler-lock-password" color="error" />
    </IconBtn>

    <IconBtn @click="extendDialogVisible = true, itemId = item.id">
        <VIcon icon="tabler-calendar-plus" color="success" />
    </IconBtn>


    <IconBtn @click="sendDialogVisible = true, userName = item.username">
        <VIcon icon="tabler-brand-telegram" color="primary" />

    </IconBtn>







</template>



<template #item.price_mode="{ item }">

    <VChip :color="item.price_mode === 'Old' ? 'grey' : 'green'" size="small">
        {{ item.price_mode }}

    </VChip>



    <VBtn v-if="item.price_mode === 'Old'" size="x-small">
        Activate
    </VBtn>
</template>



<template #bottom>
    <VDivider />

    <div class="d-flex align-center justify-space-between flex-wrap gap-3 pa-5 pt-3">
        <p class="text-sm text-medium-emphasis mb-0">
        </p>

        <VPagination v-model="store.page" :length="Math.ceil(store.total / store.limit)"
            :total-visible="$vuetify.display.xs ? 1 : 5" @update:modelValue="refresh" />
    </div>
</template>
</VDataTable>
</VCard>
</div>

<ChangePasswordDialog v-model:isDialogVisible="isDialogVisible" :userId="itemId" />
<ExtendSubscriptionDialog v-model:extendDialogVisible="extendDialogVisible" :userId="itemId" @refresh="refresh" />
<SendTelgramMassage v-model:sendDialogVisible="sendDialogVisible" :username="userName" />
</template>
