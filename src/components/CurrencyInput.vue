<template>
    <div class="app-text-field flex-grow-1" :class="$attrs.class as string | undefined">
        <VLabel v-if="label" class="mb-1 text-body-2 text-high-emphasis" :for="elementId">
            <span>{{ label }}</span>
            <b v-if="isRequired" class="text-error ml-1">*</b>
        </VLabel>
        <VTextField ref="inputRef" v-bind="{
            ...$attrs,
            class: null,
            label: undefined,
            variant: 'outlined',
            inputmode: 'numeric',
            modelValue: displayValue,
            placeholder: '0',
            onKeydown,
            id: elementId
        }" @update:modelValue="(val) => onUpdateModelValue(val, inputRef?.input)" />
    </div>
</template>
<script setup lang="ts">
import { useEnterToNext } from '@/composables/useEnterToNext';
import { useCurrencyInput } from '@/composables/useFormattedInput';
import { computed, ref, useAttrs, watch } from 'vue';

// modelValue ni endi explicit prop sifatida e'lon qilamiz
const props = defineProps<{
    modelValue?: number | string | null
}>()

const emit = defineEmits(['update:modelValue'])
const inputRef = ref()
const elementId = computed(() => {
    const attrs = useAttrs()
    const _elementIdToken = attrs.id || attrs.label
    return _elementIdToken ? `app-text-field-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}` : undefined
})

const { rawValue, displayValue, onUpdateModelValue, onKeydown: onCurrencyKeydown } = useCurrencyInput()

// 🔑 Tashqaridan (backend, prop orqali) kelgan qiymatni composable holatiga sinxronlaymiz
watch(
    () => props.modelValue,
    (val) => {
        if (val === rawValue.value) return

        if (val === null || val === undefined || val === '') {
            rawValue.value = null
            displayValue.value = ''
            return
        }

        onUpdateModelValue(String(val))
    },
    { immediate: true }
)

// Foydalanuvchi yozganda — tashqariga (ota komponentga) chiqaramiz
watch(rawValue, (val) => {
    if (val !== props.modelValue) emit('update:modelValue', val)
})

const attrs = useAttrs()
const label = computed(() => attrs.label as string | undefined)
const isRequired = computed(() => {
    const rules = attrs.rules as Array<Function> | undefined
    return rules?.some(fn => fn?.name === 'requiredValidator') ?? false
})
const { onKeydown: onEnterToNext } = useEnterToNext()
function onKeydown(e: KeyboardEvent) {
    onEnterToNext(e)
    onCurrencyKeydown(e)
}
</script>

<style scoped></style>
