<script setup lang="ts">
import { useUnitsStore } from '@/@core/stores/units';
import { ToastService } from '@/services/toast.service';
import AppScrollbar from '@/views/unit/AppScrollbar.vue';
import { VDataTable } from 'vuetify/lib/labs/components.mjs';


const store = useUnitsStore()
const isDrawerOpen = ref(false)
const deleteModal = ref(false)
const itemId = ref<number | null>(null)
const itemEdit = ref<{ id: number, name: string, label: string } | undefined>(undefined)
const serch = ref('')
const loading = ref(false)
const { t } = useI18n()



const refresh = () => {
    loading.value = true
    store.fetchUnits().then(() => { loading.value = false }).catch((error) => {
        ToastService.error(error.response._data.message)
        loading.value = false
    })
}


const customerFields = [
    { key: 'name', label: 'Name*', placeholder: 'nomi' },
    { key: 'label', label: 'yorliq*', placeholder: 'yorliq ' },


]

definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})

const headers = computed(() => [
    { title: t('headers.number'), sortable: false, key: 'id' },
    { title: t('headers.name'), key: 'name' },
    { title: t('headers.label'), key: 'label' },
    { title: t('headers.actions'), key: 'actions', sortable: false },
])

onMounted(() => {
    refresh()

})

const deleteUnit = () => {
    if (!itemId.value) return
    store.deleteUnit(itemId.value).then(() => {
        refresh()
        ToastService.success(t('unit.delete'))
        deleteModal.value = false

    })
        .catch((error) => {
            ToastService.error(error.response._data.message)
        })
}

// const page = ref(1)
// const itemsPerPage = ref(5)
// const totalOrder = ref(100)

// const computedMoreList = (id: number) => {
//     return [
//         {
//             title: 'Edit',
//             to: `/units/${id}`,
//         },
//         {
//             title: 'Delete',
//             to: `/units/${id}`,
//         },
//     ]
// }


</script>

<template>
    <VCard :title="t('unit.title')" class="mb-6">
        <VCardText>
            <VRow>
                <VCol cols="12" md="6">
                    <VTextField :label="t('search')" v-model="serch" hide-details></VTextField>

                </VCol>
                <VCol cols="12" md="6">
                    <VBtn prepend-icon="tabler-plus" class="float-end" @click="isDrawerOpen = true">
                        {{ t('add') }}
                    </VBtn>
                </VCol>
            </VRow>
        </VCardText>
    </VCard>




    <VDataTable :headers="headers" :items="store.units" :search="serch" :loading :no-data-text="t('no_data')">


        <template #item.id="{ item, index }">
            {{ index + 1 }}
        </template>
        <template #item.actions="{ item }">
            <div class="d-flex align-center">



                <IconBtn @click="isDrawerOpen = true, itemEdit = item">
                    <VIcon icon="tabler-edit" color="success" />
                </IconBtn>



                <IconBtn @click="deleteModal = true, itemId = item.id">
                    <VIcon icon="tabler-trash" color="error" />
                </IconBtn>






                <!-- <MoreBtn color="default" :menu-list="computedMoreList(item.id)" /> -->
            </div>
        </template>



        <!-- pagination -->
        <template #bottom>
            <!-- 
            <div class="d-flex align-center   justify-end flex-wrap  pa-6">

                <VPagination v-model="page" :length="Math.ceil(totalOrder / itemsPerPage)"
                    :total-visible="$vuetify.display.xs ? 1 : Math.min(Math.ceil(totalOrder / itemsPerPage), 5)">

                </VPagination>
            </div> -->
        </template>

    </VDataTable>

    <AppScrollbar :isDrawerOpen="isDrawerOpen" @update:isDrawerOpen="isDrawerOpen = $event" :fields="customerFields"
        @refresh="refresh" :editItem="itemEdit" @update:editItem="itemEdit = $event" />

    <DelateDialog v-model:delete-modal="deleteModal" @delete-element="deleteUnit" />
</template>
