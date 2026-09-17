<script lang="ts" setup>
import { useToastStore } from '@/@core/stores/toast.store'
import { useUsersStore } from '@/@core/stores/users'
import { VForm } from 'vuetify/lib/components/index.mjs'

const props = defineProps({
    sendDialogVisible: {
        type: Boolean,
        default: false,
    },
    username: {
        type: String as PropType<string | null>,
    }


})



const message = ref('')
const store = useUsersStore()
const ToastService = useToastStore()


const form = ref<InstanceType<typeof VForm> | null>(null)

const emit = defineEmits(['update:sendDialogVisible', 'refresh'])

const sendDays = () => {


    form.value?.validate().then(({ valid }) => {
        if (valid) {
            store.sendTelegramMassageUser(props.username!, message.value).then((data) => {
                ToastService.success(data.data)
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
    emit('update:sendDialogVisible', false)

}

</script>

<template>
    {{ props.username }}
    <VDialog v-model="props.sendDialogVisible" persistent class="v-dialog-sm">


        <!-- Dialog close btn -->
        <DialogCloseBtn @click="closeNavigationDrawer" />

        <!-- Dialog Content -->
        <VCard title="Parolni o'zgartirish">
            <VCardText>

                <VForm @submit.prevent="sendDays" ref="form">
                    <VRow>



                        <!-- xabar -->
                        <VCol cols="12">
                            <AppTextarea v-model="message" label="Xabar" placeholder="Xabar" type="text" />
                        </VCol>

                    </VRow>
                    <VCardText class="d-flex justify-end gap-3 flex-wrap">
                        <VBtn color="secondary" variant="tonal" @click="closeNavigationDrawer">
                            Bekor qilish
                        </VBtn>
                        <VBtn type="submit">
                            jo'natish
                        </VBtn>
                    </VCardText>

                </VForm>
            </VCardText>


        </VCard>
    </VDialog>
</template>
