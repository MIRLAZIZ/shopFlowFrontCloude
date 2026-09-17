<script setup lang="ts">


const widgetData = ref([
  { title: 'In-Store Sales', value: '$5,345.43', icon: 'tabler-home', desc: '5k orders', change: 5.7 },
  { title: 'Website Sales', value: '$674,347.12', icon: 'tabler-device-laptop', desc: '21k orders', change: 12.4 },
  { title: 'Discount', value: '$14,235.12', icon: 'tabler-gift', desc: '6k orders' },
  { title: 'Affiliate', value: '$8,345.23', icon: 'tabler-wallet', desc: '150 orders', change: -3.5 },
])

const porps = defineProps({
  products: {
    type: Object,
    required: true,
  },
})
const { t } = useI18n()


const selectedStatus = ref()
const selectedCategory = ref()
const selectedStock = ref<boolean | undefined>()
const searchQuery = ref('')
const delateModal = ref(false)
const itemId = ref(null)


const status = ref([
  { title: 'Scheduled', value: 'Scheduled' },
  { title: 'Publish', value: 'Published' },
  { title: 'Inactive', value: 'Inactive' },
])

const categories = ref([
  { title: 'Accessories', value: 'Accessories' },
  { title: 'Home Decor', value: 'Home Decor' },
  { title: 'Electronics', value: 'Electronics' },
  { title: 'Shoes', value: 'Shoes' },
  { title: 'Office', value: 'Office' },
  { title: 'Games', value: 'Games' },
])

const stockStatus = ref([
  { title: 'In Stock', value: true },
  { title: 'Out of Stock', value: false },
])

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Update data table options
const updateOptions = (options: any) => {
  page.value = options.page
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}





const productsData = ref({ products: [], total: 0 })

const products = computed(() => productsData.value.products)
const totalProduct = computed(() => productsData.value.total)



const deleteUnit = () => {
  if (!itemId.value) return
  store.deleteCategory(itemId.value).then(() => {
    refresh()
    ToastService.success(t('success'))
    delateModal.value = false

  })
    .catch((error) => {
      ToastService.error(error.response._data.message)
    })
}
</script>

<template>
  <div>
    <!-- 👉 widgets -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <template v-for="(data, id) in widgetData" :key="id">
            <VCol cols="12" sm="6" md="3" class="px-6">
              <div class="d-flex justify-space-between" :class="$vuetify.display.xs
                ? 'product-widget'
                : $vuetify.display.sm
                  ? id < 2 ? 'product-widget' : ''
                  : ''">
                <div class="d-flex flex-column gap-y-1">
                  <div class="text-body-1 font-weight-medium text-capitalize">
                    {{ data.title }}
                  </div>

                  <h4 class="text-h4 my-1">
                    {{ data.value }}
                  </h4>

                  <div class="d-flex">
                    <div class="me-2 text-disabled text-no-wrap">
                      {{ data.desc }}
                    </div>

                    <VChip v-if="data.change" label :color="data.change > 0 ? 'success' : 'error'">
                    </VChip>
                  </div>
                </div>

                <VAvatar variant="tonal" rounded size="38">
                  <VIcon :icon="data.icon" size="28" />
                </VAvatar>
              </div>
            </VCol>
            <VDivider v-if="$vuetify.display.mdAndUp ? id !== widgetData.length - 1
              : $vuetify.display.smAndUp ? id % 2 === 0
                : false" vertical inset length="95" />
          </template>
        </VRow>
      </VCardText>
    </VCard>


  </div>


  <DelateDialog v-model:delate-modal="delateModal" @delete-element="deleteUnit" />
</template>

<style lang="scss" scoped>
.product-widget {
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), var(--v-border-opacity));
  padding-block-end: 1rem;
}
</style>
