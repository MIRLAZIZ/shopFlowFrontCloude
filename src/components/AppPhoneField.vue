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
            placeholder: '90 123 45 67',
            onKeydown,
            id: elementId,
            MaxLength: 12
        }" @update:modelValue="onUpdateModelValue"> <template #prepend-inner>
                <span class="text-medium-emphasis">+998</span>
            </template></VTextField>
    </div>
</template>

<script setup lang="ts">
import { useEnterToNext } from '@/composables/useEnterToNext';
import { computed, ref, useAttrs, watch } from 'vue';

const props = defineProps<{
    modelValue?: string | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const attrs = useAttrs()

const rawValue = ref('')
const displayValue = ref('')

const elementId = computed(() => {
    const token = attrs.id || attrs.label

    return token
        ? `app-phone-field-${token}-${Math.random().toString(36).slice(2, 7)}`
        : undefined
})

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 9)

    return digits.replace(
        /(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})/,
        (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' ')
    )
}

function onUpdateModelValue(value: string) {
    rawValue.value = value.replace(/\D/g, '').slice(0, 9)
    displayValue.value = formatPhone(rawValue.value)
}

watch(
    () => props.modelValue,
    value => {
        const val = value ?? ''

        if (val === rawValue.value)
            return

        rawValue.value = val.replace(/\D/g, '').slice(0, 9)
        displayValue.value = formatPhone(rawValue.value)
    },
    { immediate: true },
)

watch(rawValue, value => {
    if (value !== props.modelValue)
        emit('update:modelValue', value)
})

const label = computed(() => attrs.label as string | undefined)

const isRequired = computed(() => {
    const rules = attrs.rules as Array<Function> | undefined

    return rules?.some(rule => rule.name === 'requiredValidator') ?? false
})

const { onKeydown: onEnterToNext } = useEnterToNext()

function onKeydown(e: KeyboardEvent) {
    onEnterToNext(e)

    const allowed = [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
    ]

    if (allowed.includes(e.key))
        return

    if (!/^\d$/.test(e.key))
        e.preventDefault()
}
</script>
