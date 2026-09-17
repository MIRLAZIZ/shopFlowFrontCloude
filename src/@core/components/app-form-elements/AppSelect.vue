<script lang="ts" setup>
defineOptions({
  name: 'AppSelect',
  inheritAttrs: false,
})
const attrs = useAttrs()

const elementId = computed(() => {
  const _elementIdToken = attrs.id || attrs.label

  return _elementIdToken ? `app-select-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}` : undefined
})

const isRequired = computed(() => {

  const rules = attrs.rules as Array<Function> | undefined
  if (!rules) return false
  return rules.some(fn => fn === undefined ? false : fn.name === 'requiredValidator')
})

const label = computed(() => useAttrs().label as string | undefined)
</script>

<template>
  <div class="app-select flex-grow-1" :class="$attrs.class">
    <VLabel v-if="label" :for="elementId" class="mb-1 text-body-2 text-high-emphasis">
      <span>{{ label }}</span> <b v-if="isRequired" class="text-error  ml-1">*</b>
    </VLabel>
    <VSelect v-bind="{
      ...$attrs,
      class: null,
      label: undefined,
      variant: 'outlined',
      id: elementId,
      menuProps: { contentClass: ['app-inner-list', 'app-select__content', 'v-select__content', $attrs.multiple !== undefined ? 'v-list-select-multiple' : ''] },
    }">
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </VSelect>
  </div>
</template>
