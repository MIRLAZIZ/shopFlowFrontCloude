<template>
  <div>
    <pre>
      <!-- {{ store.products }} -->
    </pre>
    <!-- 👉 products -->
    <VCard class="mb-6 " title="Products">

      <template #append>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="router.push('products/create')">
          Add Product
        </VBtn>
      </template>
      <VCardText>
        <h3>Filters</h3>

        <VRow>

          <!-- 👉 Select Status -->
          <VCol cols="12" sm="4">
            <AppSelect v-model="filterAndSearch.status" placeholder="Status"
              :items="[{ value: 1, text: 'Active' }, { value: 0, text: 'Inactive' }]" clearable clear-icon="tabler-x"
              item-title="text" item-value="value" />
          </VCol>

          <!-- 👉 Select Category -->
          <VCol cols="12" sm="4">
            <AppSelect v-model="filterAndSearch.categoryId" placeholder="Category" :items="categoryisStoere.categories"
              clearable clear-icon="tabler-x" item-value="id" item-title="name" />
          </VCol>

          <!-- 👉 Select Stock Status -->
          <VCol cols="12" sm="4">
            <AppSelect v-model="filterAndSearch.stock" placeholder="Stock" :items="store.stockFilters" clearable
              clear-icon="tabler-x" item-value="value" item-title="name" />
          </VCol>
        </VRow>
      </VCardText>


      <VDivider />


      <VCardText>
        <h3>izlash</h3>
        <VRow>

          <VCol cols="12" sm="4">
            <AppTextField v-model="filterAndSearch.name" placeholder="nomi" density="compact" class="me-3" clearable />


          </VCol>
          <VCol cols="12" sm="4">
            <AppTextField v-model="filterAndSearch.barcode" placeholder="barcode" density="compact" class="me-3"
              clearable />


          </VCol>

          <VCol cols="12" sm="4">
            <AppTextField v-model="filterAndSearch.quickCode" placeholder="quick_code" density="compact" class="me-3"
              clearable />


          </VCol>

        </VRow>





      </VCardText>





      <!-- 👉 Datatable  -->
      <VDataTable :headers="headers" :items="store.products" class="text-no-wrap  " :no-data-text="t('no_data')"
        :loading="loading" :loading-text="t('loading')" :items-per-page="store.limit"">



        <template #item.barcode="{ item }">
        <span v-if="item.barcode"> {{ item.barcode }} </span>
        <span v-else> - </span>
</template>

<template #item.quick_code="{ item }">
  <span v-if="item.quick_code"> {{ item.quick_code }} </span>
  <span v-else> - </span>
</template>




<!-- Actions -->
<template #item.actions="{ item }">



  <IconBtn @click="router.push(`/products/${item.id}/batches/create`)">
    <VIcon icon="tabler-plus" color="success" />

  </IconBtn>

  <IconBtn @click="router.push(`/products/edit/${item.id}`)">
    <VIcon icon="tabler-edit" color="success" />
  </IconBtn>


  <IconBtn @click="deleteModal = true, itemId = item.id">
    <VIcon icon="tabler-trash" color="error" />
  </IconBtn>

  <IconBtn @click="router.push(`/products/${item.id}/batches/list`)">
    <VIcon icon="tabler-packages" color="primary" />

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

  <div class="d-flex align-center justify-space-between flex-wrap gap-3 pa-5 pt-3" v-if="store.total > 0">
    <p class="text-sm text-medium-emphasis mb-0">
    </p>

    <VPagination v-model="store.page" :length="Math.ceil(store.total / store.limit)"
      :total-visible="$vuetify.display.xs ? 1 : 5" @update:modelValue="refresh" />
  </div>
</template>
</VDataTable>
</VCard>
</div>

<DelateDialog v-model:delete-modal="deleteModal" @delete-element="deleteProduct" />
</template>

<script lang="ts" setup>
import { useCategoriesStore } from '@/@core/stores/categories';
import { useProductsStore } from '@/@core/stores/products';
import { useToastStore } from '@/@core/stores/toast.store';
import { useDebounceFn } from '@vueuse/core';
import { useRouter } from 'vue-router';
import { VDataTable } from 'vuetify/labs/VDataTable';
definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})



const { t } = useI18n()
const router = useRouter()
const toasStore = useToastStore()
const categoryisStoere = useCategoriesStore()


const headers = [
  { title: 'Nomi', key: 'name' },
  { title: 'Selling Price', key: 'selling_price', sortable: false },
  { title: 'Olingan narxi', key: 'purchase_price', sortable: false },
  { title: 'birlik', key: 'unit.name', sortable: false },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Barcode', key: 'barcode', sortable: false },
  { title: 'Quick Code', key: 'quick_code' },
  // { title: 'Low Stock', key: 'isLowStock', sortable: false },
  { title: 'Price Mode', key: 'pricing_strategy', sortable: false },
  // { title: 'Status', key: 'status', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },

]

const priceMode = [{ title: 'Eski narx', value: 'Old' }, { title: 'Yeni narx', value: 'Current' }]

const filterAndSearch = reactive({
  categoryId: null,
  status: null,
  stock: null,
  name: null,
  barcode: null,
  quickCode: null

})


const store = useProductsStore()
const deleteModal = ref(false)
const itemId = ref<number | null>(null)
const loading = ref(false)


const refresh = () => {
  store.fetchProducts(store.page)
    .then(() => { loading.value = false })
    .catch((error) => {
      toasStore.error(error.response._data.message)
      loading.value = false
    })


}



onMounted(() => {
  refresh()
  categoryisStoere.fetchcategories()

})


const deleteProduct = () => {
  if (!itemId.value) return
  store.deleteProduct(itemId.value).then(() => {
    refresh()
    toasStore.success(t('success'))
    deleteModal.value = false
  })
    .catch((error) => {
      toasStore.error(error.response._data.message)
    })
}



const search = useDebounceFn(async () => {
  const hasFilter = Object.values(filterAndSearch).some(
    value => value !== undefined && value !== null && value !== ""
  );

  if (hasFilter) {
    await store.fetchFilterAndSearch(filterAndSearch);
  } else {
    await store.fetchProducts(store.page);
  }
}, 500);

watch(filterAndSearch, search, {
  deep: true,
});



</script>
