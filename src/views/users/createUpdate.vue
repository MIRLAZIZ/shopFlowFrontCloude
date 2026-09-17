<script setup lang="ts">
// import { PriceMode } from 'common/enums/priceMode.enum'
import { useCategoriesStore } from '@/@core/stores/categories'
import { useToastStore } from '@/@core/stores/toast.store'
import { useUsersStore } from '@/@core/stores/users'
import { UserData } from '@/interface/user-data.interface'
import { User } from '@/interface/users.interface'
import { confirmedValidator, passwordValidator, requiredValidator } from '@core/utils/validators'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { VForm } from 'vuetify/lib/components/index.mjs'





const categoryStore = useCategoriesStore()
const store = useUsersStore()
const router = useRouter()
const toastStore = useToastStore()
const route = useRoute()
const userId = (route.params as { id: string }).id
const userForm = ref<User>({
    fullName: null,
    username: null,
    password: null,
    brandName: null,
    role: null,
    phone: null,



})

const errorMessage = ref({
    name: null,
    barcode: null,
    quick_code: null,
})
const confirmPassword = ref<string>('')



const isLoading = ref(false)
const formRef = ref<InstanceType<typeof VForm> | null>(null)
const userRole = ref<UserData>()

onMounted(() => {
    categoryStore.fetchcategories()

    if (userId) {
        store.fetchOneUser(Number(userId)).then((response) => {
            const resmponse = response.data

            userForm.value.fullName = resmponse.fullName
            userForm.value.username = resmponse.username
            userForm.value.password = resmponse.password
            userForm.value.brandName = resmponse.brandName
            userForm.value.role = resmponse.role
            userForm.value.phone = resmponse.phone



        })
    }

    userRole.value = useCookie<UserData>('userData').value

})


const closeNavigationDrawer = async () => {
    formRef.value?.resetValidation()
    await router.push('/users')
}




const saveProduct = () => {

    formRef.value?.validate().then(({ valid }) => {

        if (valid) {


            isLoading.value = true

            if (!userId) {

                const payload = {
                    ...userForm.value,
                    phone: `998${userForm.value.phone ?? ''}`
                }

                store.createUser(payload).then(() => {
                    isLoading.value = false
                    closeNavigationDrawer()
                        .then(() => {
                            toastStore.success('Mahsulot muvaffaqiyatli qo\'shildi')

                        })

                }).catch((error) => {
                    isLoading.value = false


                    let parseErorr = error.response._data.message
                    errorMessage.value = parseErorr
                    console.log(parseErorr);

                    toastStore.showErrors(parseErorr)




                    // toastStore.error(error.response._data.message)
                })

            } else {

                const filterProductForm = Object.fromEntries(Object.entries(userForm.value).filter(([key, value]) => value != null))

                store.updateUser(Number(userId), filterProductForm).then(() => {
                    isLoading.value = false
                    closeNavigationDrawer()
                        .then(() => {
                            toastStore.success('Mahsulot muvaffaqiyatli qo\'shildi')

                        })

                }).catch((error) => {
                    isLoading.value = false
                    let parseErorr = JSON.parse(error.response._data.message)
                    errorMessage.value = parseErorr
                    toastStore.showErrors(parseErorr)
                })

            }


        }


    })


}


</script>

<template>
    <div>
        <div class="d-flex flex-column justify-center">
            <h4 class="text-h4 font-weight-medium" v-if="userId">
                Foydalanuvchi tahrirlash
            </h4>
            <h4 class="text-h4 font-weight-medium" v-else>
                Foydalanuvchi qo'shish
            </h4>

        </div>


        <VForm ref="formRef" class="mt-6" @submit.prevent="saveProduct">
            <VRow>

                <VCol cols="12">

                    <!-- Asosiy ma'lumotlar -->
                    <VCard class="mb-12" title="Asosiy ma'lumotlar">
                        <VCardText>
                            <VRow>
                                <!-- Nomi -->
                                <VCol cols="12" md="6">
                                    <AppTextField v-model="userForm.fullName" label="fullname"
                                        placeholder="Ism va familiya" :rules="[requiredValidator]" />
                                </VCol>

                                <!-- username -->
                                <VCol cols="12" md="6">
                                    <AppTextField v-model="userForm.username" label="username"
                                        placeholder="foydalanuvchi nomi" :error-messages="errorMessage.barcode"
                                        :rules="[requiredValidator]" />
                                </VCol>

                                <!-- phone -->
                                <VCol cols="12" md="6">

                                    <AppPhoneField v-model="userForm.phone" label="phone" placeholder="telifon raqami"
                                        :rules="[requiredValidator]" />
                                </VCol>


                                <!-- brandName -->
                                <VCol cols="12" md="6">
                                    <AppTextField v-model="userForm.brandName" label="Tashkilot nomi"
                                        placeholder="tashkilot nomi" :error-messages="errorMessage.quick_code"
                                        :rules="userForm.role == 'client' ? [requiredValidator] : []" />
                                </VCol>


                                <!-- password -->
                                <VCol cols="12" md="6" v-if="!userId">
                                    <AppTextField v-model="userForm.password" label="parol"
                                        placeholder="parolni kiriting"
                                        hint="Kamida 8 ta belgi: katta/kichik harf, raqam va maxsus belgi."
                                        type="password" :error-messages="errorMessage.quick_code"
                                        :rules=[passwordValidator] />
                                </VCol>

                                <!-- confirmpassword -->
                                <VCol cols="12" md="6" v-if="!userId">
                                    <AppTextField v-model="confirmPassword" label="parolni takrorlang"
                                        placeholder="parolni takrorlang" type="password"
                                        :rules="[requiredValidator, confirmedValidator]" />
                                </VCol>


                                <!-- role -->
                                <VCol cols="12" md="6" v-if="userRole?.role == 'admin'">
                                    <AppSelect v-model="userForm.role"
                                        :items='[{ title: "Agent", value: "agent" }, { title: "Client", value: "client" }]'
                                        label="role" placeholder="Tanlang" item-title="title" item-value="value"
                                        :rules="[requiredValidator]" />
                                </VCol>




                            </VRow>
                        </VCardText>
                    </VCard>






                </VCol>






            </VRow>


            <!-- ─── footer ─────────────────────────────────────────── -->
            <div class="d-flex flex-wrap     justify-end  gap-y-4 gap-x-6 mb-6">


                <div class="d-flex gap-4 align-center  mt-4 ">
                    <VBtn variant="tonal" color="secondary" @click="closeNavigationDrawer">
                        Bekor qilish
                    </VBtn>
                    <VBtn :loading="isLoading" type="submit">
                        Saqlash
                    </VBtn>
                </div>
            </div>

        </VForm>
    </div>
</template>
