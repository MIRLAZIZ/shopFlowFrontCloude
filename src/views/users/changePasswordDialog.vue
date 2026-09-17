<script lang="ts" setup>
import { useToastStore } from '@/@core/stores/toast.store'
import { useUsersStore } from '@/@core/stores/users'
import { confirmedValidator, passwordValidator } from '@core/utils/validators'
import { VForm } from 'vuetify/lib/components/index.mjs'

const props = defineProps({
    isDialogVisible: {
        type: Boolean,
        default: false,
    },
    userId: {
        type: Number as PropType<number | null>,
    }
})
const isPasswordVisible = ref(false)

const passworData = reactive({
    password: '',
    confirmPassword: '',
})
const store = useUsersStore()
const ToastService = useToastStore()


const form = ref<InstanceType<typeof VForm> | null>(null)

const emit = defineEmits(['update:isDialogVisible'])
const sendPassword = () => {
    form.value?.validate().then(({ valid }) => {
        if (valid) {
            store.changePassword(props.userId!, passworData).then(() => {
                ToastService.success('Parol muvaffaqiyatli o\'zgartirildi')
                emit('update:isDialogVisible', false)
            }).catch((error) => {
                ToastService.error(error.response._data.message)
            })
        }
    })

}


const closeNavigationDrawer = () => {
    form.value?.resetValidation()
    form.value?.reset()
    emit('update:isDialogVisible', false)

}

</script>

<template>
    <VDialog v-model="props.isDialogVisible" persistent class="v-dialog-sm">


        <!-- Dialog close btn -->
        <DialogCloseBtn @click="closeNavigationDrawer" />

        <!-- Dialog Content -->
        <VCard title="Parolni o'zgartirish">
            <VCardText>

                <VForm @submit.prevent="sendPassword" ref="form">
                    <VRow>

                        <!-- password -->
                        <VCol cols="12" md="6">
                            <AppTextField v-model="passworData.password" label="parol" placeholder="parolni kiriting"
                                :type="isPasswordVisible ? 'text' : 'password'"
                                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                                @click:append-inner="isPasswordVisible = !isPasswordVisible"
                                :rules="[passwordValidator]" />
                        </VCol>

                        <!-- confirmpassword -->
                        <VCol cols="12" md="6">
                            <AppTextField v-model="passworData.confirmPassword" label="parolni takrorlang"
                                placeholder="parolni takrorlang"
                                :rules="[confirmedValidator(passworData.password, passworData.confirmPassword)]"
                                :type="isPasswordVisible ? 'text' : 'password'"
                                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                                @click:append-inner="isPasswordVisible = !isPasswordVisible" />
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
