<script setup lang="ts">
import AppLoader from '@/@core/components/AppLoader.vue'
import { useCategoriesStore } from '@/@core/stores/categories'
import { Category } from '@/interface/categories'
import { ToastService } from '@/services/toast.service'
import { requiredValidator } from '@core/utils/validators'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { VForm } from 'vuetify/components/VForm'



const store = useCategoriesStore()
const isLoading = ref(false)
const { t } = useI18n()


const props = defineProps({
    isDrawerOpen: {
        type: Boolean,
        required: true,
    },
    editItem: {
        type: Object as PropType<Category | undefined>,
        default: () => (undefined)
    }
})

const emit = defineEmits<{
    (e: 'update:isDrawerOpen', value: boolean): void
    (e: 'refresh'): void
    (e: 'update:editItem', value: undefined): void
}>()

const refVForm = ref<VForm>()

const categoryData = ref<Omit<Category, 'id'>>({
    name: '',
})


const handleDrawerModelValueUpdate = (val: boolean) => {
    emit('update:isDrawerOpen', val)
}

const resetForm = () => {
    refVForm.value?.reset()
    emit('update:editItem', undefined)
    emit('update:isDrawerOpen', false)
}
watch(() => props.editItem, (val) => {
    if (val) {
        categoryData.value = { name: val.name }
    } else {
        categoryData.value = { name: '' }
    }
})




const onSubmit = () => {
    refVForm.value?.validate().then(({ valid }) => {
        if (valid) {
            isLoading.value = true
            if (!props.editItem) {
                store.createCategory(categoryData.value).then(() => {
                    isLoading.value = false
                    ToastService.success(t('success'))
                    emit('refresh')
                    resetForm()
                }).catch((error) => {

                    ToastService.error(error.response._data.message)
                    isLoading.value = false
                })
            } else {

                store.updateCategory(props.editItem.id, categoryData.value).then(() => {
                    isLoading.value = false
                    ToastService.success(t('success'))
                    emit('refresh')
                    resetForm()

                }).catch((error) => {

                    isLoading.value = false
                    ToastService.error(error.response._data.message)
                })

            }



        }
    })
}


</script>

<template>
    <VNavigationDrawer :model-value="props.isDrawerOpen" temporary location="end" width="370"
        @update:model-value="handleDrawerModelValueUpdate">
        <AppDrawerHeaderSection :title="props.editItem ? t('categorys.edit') : t('categorys.add')"
            @cancel="resetForm" />
        <VDivider />


        <VCard flat>
            <PerfectScrollbar :options="{ wheelPropagation: false }" class="h-100">
                <VCardText style="block-size: calc(100vh - 5rem);">
                    <VForm ref="refVForm" @submit.prevent="onSubmit">
                        <VRow>

                            <!-- 👉 Text Input -->
                            <VCol cols="12">
                                <AppTextField v-model="categoryData.name" :label="t('categorys.name') + '*'"
                                    :placeholder="t('categorys.category-placeholder')" type="text"
                                    :rules="[requiredValidator]" />
                            </VCol>









                            <!-- 👉 Buttons -->
                            <VCol cols="12">
                                <div class="d-flex justify-start">
                                    <VBtn type="submit" color="primary" class="me-4">
                                        <span v-if="isLoading" class="d-flex align-center gap-2">
                                            <AppLoader inline white :size="18" />
                                            Yuklanmoqda...
                                        </span>
                                        <span v-else>
                                            {{ props.editItem ? t('update') : t('add') }}
                                        </span>
                                    </VBtn>
                                    <VBtn color="error" variant="tonal" @click="resetForm">
                                        {{ t('discard') }}
                                    </VBtn>
                                </div>
                            </VCol>
                        </VRow>
                    </VForm>
                </VCardText>
            </PerfectScrollbar>
        </VCard>
    </VNavigationDrawer>
</template>
