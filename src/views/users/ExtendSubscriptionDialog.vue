<script lang="ts" setup>
import { useToastStore } from '@/@core/stores/toast.store'
import { useUsersStore } from '@/@core/stores/users'
import { requiredValidator } from '@core/utils/validators'
import { VForm } from 'vuetify/lib/components/index.mjs'

const props = defineProps({
    extendDialogVisible: {
        type: Boolean,
        default: false,
    },
    userId: {
        type: Number as PropType<number | null>,
    }


})



const extendSubscription = reactive({
    days: null as number | null,
    debtAmount: null as number | null,
    note: null as string | null
})
const store = useUsersStore()
const ToastService = useToastStore()


const form = ref<InstanceType<typeof VForm> | null>(null)

const emit = defineEmits(['update:extendDialogVisible', 'refresh'])

const sendDays = () => {


    form.value?.validate().then(({ valid }) => {
        if (valid) {
            store.subscriptonManually(props.userId!, extendSubscription).then(() => {
                ToastService.success('Parol muvaffaqiyatli o\'zgartirildi')
                emit('refresh')
                closeNavigationDrawer()

            }).catch((error) => {
                ToastService.error(error.response._data.message)
            })
        }
    })

}


const closeNavigationDrawer = () => {
    form.value?.resetValidation()
    form.value?.reset()
    emit('update:extendDialogVisible', false)

}

</script>

<template>
    <VDialog v-model="props.extendDialogVisible" persistent class="v-dialog-sm">


        <!-- Dialog close btn -->
        <DialogCloseBtn @click="closeNavigationDrawer" />

        <!-- Dialog Content -->
        <VCard title="Kunlarni qo'shish">
            <VCardText>

                <VForm @submit.prevent="sendDays" ref="form">
                    <VRow>

                        <!-- days -->
                        <VCol cols="12" md="6">
                            <AppTextField v-model.number="extendSubscription.days" label="qo'shiladigan kunlar soni"
                                placeholder="kunni kiriting" type="number" :rules="[requiredValidator]" />
                        </VCol>

                        <!-- debtAmount -->
                        <VCol cols="12" md="6">
                            <CurrencyInput v-model="extendSubscription.debtAmount" label="qarz summasi"
                                placeholder="qarz summasini kiriting" :rules="[requiredValidator]" />
                        </VCol>

                        <!-- note -->
                        <VCol cols="12" md="6">
                            <AppTextarea v-model="extendSubscription.note" label="note" placeholder="note"
                                type="text" />
                        </VCol>

                    </VRow>
                    <VCardText class="d-flex justify-end gap-3 flex-wrap">
                        <VBtn color="secondary" variant="tonal" @click="closeNavigationDrawer">
                            Disagree
                        </VBtn>
                        <VBtn type="submit">
                            Agree
                        </VBtn>
                    </VCardText>

                </VForm>
            </VCardText>


        </VCard>
    </VDialog>
</template>
