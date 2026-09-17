<script setup lang="ts">
// import { PriceMode } from 'common/enums/priceMode.enum'
import { useCategoriesStore } from '@/@core/stores/categories'
import { useProductsStore } from '@/@core/stores/products'
import { useUnitsStore } from '@/@core/stores/units'
// import { useFormattedInput } from '@/composables/useFormattedInput'
import { useToastStore } from '@/@core/stores/toast.store'
import CurrencyInput from '@/components/CurrencyInput.vue'
import { ErrorType, ProductFormType } from '@/type/products.type'
import { requiredValidator } from '@core/utils/validators'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { VForm } from 'vuetify/lib/components/index.mjs'




const unitStore = useUnitsStore()
const categoryStore = useCategoriesStore()
const productStore = useProductsStore()
const router = useRouter()
const toastStore = useToastStore()
const route = useRoute()
const productId = (route.params as { id: string }).id





const productForm = ref<ProductFormType>({
  name: null,
  barcode: null,
  quick_code: null,
  max_quantity_notification: null,
  quantity: null,
  unit_id: null,
  // category_id: null,
  purchase_price: null,
  selling_price: null,
  deliveryCost: null,
  vatRate: null,
  costPrice: null,
  pricing_strategy: null,
})

const errorMessage = ref<ErrorType>({
  name: null,
  barcode: null,
  quick_code: null,
})

const isLoading = ref(false)
const formRef = ref<InstanceType<typeof VForm> | null>(null)

onMounted(() => {
  productForm.value.pricing_strategy = productStore.priceMode[0].value
  unitStore.fetchUnits()
  categoryStore.fetchcategories()

  if (productId) {
    productStore.fetchOneProduct(Number(productId)).then((response) => {
      const resmponse = response.data
      productForm.value.name = resmponse.name
      productForm.value.barcode = resmponse.barcode
      productForm.value.quick_code = resmponse.quick_code
      productForm.value.max_quantity_notification = resmponse.max_quantity_notification
      productForm.value.unit_id = resmponse.unit.id
      // productForm.value.category_id = resmponse.category.id


    })
  }
})


const closeNavigationDrawer = async () => {
  formRef.value?.resetValidation()
  await router.push('/products')
}


const computedCostPrice = computed(() => {
  const purchase = productForm.value.purchase_price ?? 0
  const delivery = productForm.value.deliveryCost ?? 0
  const vat = productForm.value.vatRate ?? 0
  const quantity = productForm.value.quantity ?? 0

  if (!purchase && !quantity) return 0



  const costPrice = purchase + (delivery / quantity)
  const vatPrice = (costPrice / 100) * vat
  const totalCostPrice = costPrice + vatPrice

  // Masalan: costPrice = purchase + delivery + (purchase * vat / 100)
  return totalCostPrice
})

const saveProduct = () => {

  formRef.value?.validate().then(({ valid }) => {

    if (valid) {


      isLoading.value = true

      if (!productId) {

        productStore.createProduct(productForm.value).then(() => {
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




          // toastStore.error(error.response._data.message)
        })

      } else {

        const filterProductForm = Object.fromEntries(Object.entries(productForm.value).filter(([key, value]) => value != null))

        productStore.updataProduct(Number(productId), filterProductForm).then(() => {
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
      <h4 class="text-h4 font-weight-medium" v-if="productId">
        Mahsulotni tahrirlash
      </h4>
      <h4 class="text-h4 font-weight-medium" v-else>
        Yangi mahsulot qo'shish
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
                  <AppTextField v-model="productForm.name" label="Mahsulot nomi" placeholder="Masalan: Coca-Cola 0.5L"
                    :rules="[requiredValidator]" :error-messages="errorMessage.name" />
                </VCol>





                <!-- Minimum qoldiq -->
                <VCol cols="12" md="6">

                  <CurrencyInput v-model="productForm.max_quantity_notification" placeholder="0"
                    label="Minimum qoldiq (ogohlantirish)" />
                </VCol>


                <!-- Barcode -->
                <VCol cols="12" md="6">
                  <AppTextField v-model="productForm.barcode" label="Barcode" placeholder="0123-4567"
                    :error-messages="errorMessage.barcode" />
                </VCol>

                <!-- Quick code -->
                <VCol cols="12" md="6">
                  <AppTextField v-model="productForm.quick_code" label="Tez kod" placeholder="A1, B2, 99..."
                    hint="Tez sotish uchun qisqa kod" persistent-hint :error-messages="errorMessage.quick_code" />
                </VCol>

                <!-- Birlik -->
                <VCol cols="12" md="6">
                  <AppSelect v-model="productForm.unit_id" :items="unitStore.units" label="Birlik" placeholder="Tanlang"
                    item-title="name" item-value="id" :rules="[requiredValidator]" />
                </VCol>

                <!-- categorya -->
                <!-- <VCol cols="12" md="6">
                  <AppSelect v-model="productForm.category_id" :items="categoryStore.categories" label="Kategoriya"
                    placeholder="Tanlang" item-title="name" item-value="id" :rules="[requiredValidator]" />

                </VCol> -->

                <!-- pricing_mode -->
                <VCol cols="12" md="6">
                  <AppSelect v-model="productForm.pricing_strategy" :items="productStore.priceMode" label="Kategoriya"
                    placeholder="Tanlang" item-title="name" item-value="value" :rules="[requiredValidator]" />

                </VCol>
              </VRow>
            </VCardText>
          </VCard>




          <!------------------------------------ Narx ma'lumotlari ------------------------------------>
          <VCard title="Narx ma'lumotlari">
            <VCardText>
              <VRow>



                <!-- Xarid narxi -->
                <VCol cols="12" md="6">
                  <CurrencyInput v-model="productForm.purchase_price" placeholder="0" label="Xarid narxi"
                    :rules="[requiredValidator]" />
                </VCol>






                <!-- miqdori  -->
                <VCol cols="12" md="6">


                  <CurrencyInput v-model="productForm.quantity" placeholder="0" label="Miqdori"
                    :rules="[requiredValidator]" />
                </VCol>


                <!-- Sotuv narxi -->
                <VCol cols="12" md="6">

                  <CurrencyInput v-model="productForm.selling_price" placeholder="0" label="Sotuv narxi"
                    :rules="[requiredValidator]" />

                </VCol>

                <!-- Delivery narxi -->
                <VCol cols="12" md="6">


                  <CurrencyInput v-model="productForm.deliveryCost" placeholder="0" label="Delivery narxi" />
                </VCol>

                <!-- Vat rate -->
                <VCol cols="12" md="6">
                  <CurrencyInput v-model="productForm.vatRate" placeholder="0" label="Vat rate" />
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
