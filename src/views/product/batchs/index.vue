<template>
    <div>
        <VCard :title="productName + (
            route.name === 'products-batches-id'
                ? ' mahsuloti partiyasini tahrirlash'
                : ' mahsulotiga yangi partiya qo\'shish'
        )">
            <VCardText>

                <VForm ref="formRef" class="mt-6" @submit.prevent="saveProduct">

                    <VRow>



                        <!-- Xarid narxi -->
                        <VCol cols="12" md="6">
                            <CurrencyInput v-model="productBatch.purchase_price" placeholder="0" label="Xarid narxi"
                                :rules="[requiredValidator]" />
                        </VCol>





                        <!-- miqdori  -->
                        <VCol cols="12" md="6">


                            <CurrencyInput v-model="productBatch.quantity" placeholder="0" label="Miqdori"
                                :rules="[requiredValidator]" />
                        </VCol>


                        <!-- Sotuv narxi -->
                        <VCol cols="12" md="6">

                            <CurrencyInput v-model="productBatch.selling_price" placeholder="0" label="Sotuv narxi"
                                :rules="[requiredValidator]" />

                        </VCol>


                        <!-- Delivery narxi -->
                        <VCol cols="12" md="6">


                            <CurrencyInput v-model="productBatch.deliveryCost" placeholder="0" label="Delivery narxi" />
                        </VCol>

                        <!-- Vat rate -->
                        <VCol cols="12" md="6">
                            <CurrencyInput v-model="productBatch.vatRate" placeholder="0" label="Vat rate" />
                        </VCol>

                        <!-- cost price  -->
                        <!-- Narx ma'lumotlari kartasi ichida, inputlardan keyin -->
                        <VCol cols="12">
                            <VDivider class="mb-4" />
                            <div class="d-flex align-center justify-space-between pa-3  rounded">
                                <div>
                                    <div class="text-caption text-medium-emphasis">Tannarx (Cost Price)</div>
                                    <div class="text-h6 font-weight-bold text-primary">
                                        {{ computedCostPrice ? computedCostPrice.toLocaleString() + ' so\'m' : '—' }}
                                    </div>
                                </div>
                                <VIcon icon="tabler-calculator" size="32" color="primary" opacity="0.4" />
                            </div>
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
            </VCardText>
        </VCard>

    </div>
</template>

<script setup lang="ts">
import { useProductsStore } from '@/@core/stores/products';
import { useToastStore } from '@/@core/stores/toast.store';
import { ProductBatch } from '@/interface/products.interface';
import { requiredValidator } from '@core/utils/validators';
import { useRoute, useRouter } from 'vue-router';
import { VForm } from 'vuetify/lib/components/index.mjs';


const isLoading = ref(false)
const router = useRouter()
const route = useRoute()
const store = useProductsStore()
const routeId = Number((route.params as { id: number }).id)

const toastStore = useToastStore()
const productName = ref(null as string | null)

enum PriceMode {
    UNIFORM = 'UNIFORM',
    FIFO = 'FIFO'
}
const formRef = ref<InstanceType<typeof VForm> | null>(null)


const productBatch = ref<ProductBatch>({

    quantity: null,
    purchase_price: null,
    selling_price: null,
    deliveryCost: null,
    vatRate: null,
    costPrice: null,
    product_id: null,
})





const computedCostPrice = computed(() => {
    const purchase = productBatch.value.purchase_price ?? 0
    const delivery = productBatch.value.deliveryCost ?? 0
    const vat = productBatch.value.vatRate ?? 0
    const quantity = productBatch.value.quantity ?? 0

    if (!purchase && !quantity) return 0



    const costPrice = purchase + (delivery / quantity)
    const vatPrice = (costPrice / 100) * vat
    const totalCostPrice = costPrice + vatPrice

    // Masalan: costPrice = purchase + delivery + (purchase * vat / 100)
    return totalCostPrice
})
const closeNavigationDrawer = async () => {
    let path = '/products'

    if (route.name === 'products-batches-id') {

        path = `/products/${productBatch.value.product_id}/batches/list`
    }
    formRef.value?.resetValidation()
    await router.push(path)
}


const fetchProductOrBatch = () => {



    if (route.name === 'products-batches-id') {
        store.fetchBatchOne(routeId).then((res) => {
            const data = res.data

            productBatch.value.purchase_price = data.purchase_price
            productBatch.value.selling_price = data.selling_price
            productBatch.value.quantity = data.quantity
            productBatch.value.deliveryCost = data.deliveryCost
            productBatch.value.vatRate = data.vatRate
            productBatch.value.product_id = data.product.id

            productName.value = res.data.product.name




        })
    } else {
        store.fetchProductOne(routeId).then((res) => {
            productName.value = res.data.name
        })

    }


}


onMounted(() => {

    fetchProductOrBatch()







})




const saveProduct = () => {

    formRef.value?.validate().then(({ valid }) => {

        if (valid) {



            isLoading.value = true

            if (route.name !== 'products-batches-id') {
                productBatch.value.product_id = routeId


                const { costPrice, ...filterProductForm } = productBatch.value
                store.createBatch(filterProductForm).then(() => {

                    isLoading.value = false
                    closeNavigationDrawer()
                        .then(() => {
                            toastStore.success('Mahsulot muvaffaqiyatli qo\'shildi')

                        })

                }).catch((error) => {
                    isLoading.value = false

                    // let parseErorr = JSON.parse(error.response._data.message)
                    // errorMessage.value = parseErorr
                    toastStore.showErrors(error.response._data.message)




                    // toastStore.error(error.response._data.message)
                })

            } else {

                const filterProductForm = Object.fromEntries(Object.entries(productBatch.value).filter(([key, value]) => value != null))

                store.updateBatch(Number(routeId), filterProductForm).then(() => {
                    isLoading.value = false
                    closeNavigationDrawer()
                        .then(() => {
                            toastStore.success('Mahsulot muvaffaqiyatli qo\'shildi')

                        })

                }).catch((error) => {
                    isLoading.value = false
                    // let parseErorr = JSON.parse(error.response._data.message)
                    // errorMessage.value = parseErorr
                    toastStore.showErrors(error.response._data.message)
                })

            }


        }


    })


}
</script>

<style scoped></style>
