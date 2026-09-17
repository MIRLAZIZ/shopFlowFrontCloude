<script lang="ts" setup>
import { useEnterToNext } from '@/composables/useEnterToNext'
defineOptions({
  name: 'AppTextField',
  inheritAttrs: false,
})


const { onKeydown } = useEnterToNext()
const elementId = computed(() => {
  const attrs = useAttrs()
  const _elementIdToken = attrs.id || attrs.label

  return _elementIdToken ? `app-text-field-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}` : undefined
})

const label = computed(() => useAttrs().label as string | undefined)

const isRequired = computed(() => {
  const rules = useAttrs().rules as Array<Function> | undefined
  if (!rules) return false
  return rules.some(fn => fn === undefined ? false : fn.name === 'requiredValidator')
})
</script>

<template>
  <div class="app-text-field flex-grow-1" :class="$attrs.class as string | undefined">
    <VLabel v-if="label" :for="elementId" class="mb-1 text-body-2 text-high-emphasis">
      <span>{{ label }}</span><b v-if="isRequired" class="text-error ml-1">*</b>
    </VLabel>
    <VTextField v-bind="{
      ...$attrs,
      class: null,
      label: undefined,
      variant: 'outlined',
      id: elementId,
      onKeydown
    }">
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </VTextField>
  </div>
</template>
