<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div>
    <!-- 👉 Delete Dialog  -->
    <VDialog v-model="props.deleteModal" max-width="500px" persistent>
      <VCard>
        <VCardTitle>
          {{ t('delete_confirm') }}
        </VCardTitle>

        <VCardActions>
          <VSpacer />

          <VBtn color="error" variant="outlined" @click="emit('update:delateModal', false)">
            {{ t('cancel') }}
          </VBtn>

          <VBtn color="success" variant="elevated" @click="emit('deleteElement')">
            {{ t('ok') }}
          </VBtn>

          <VSpacer />
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
const props = defineProps({
  deleteModal: {
    type: Boolean,
    required: true,
  },
})
const { t } = useI18n()

const emit = defineEmits(['update:delateModal', 'deleteElement'])




const deleteDialog = ref(true)
</script>
