<script setup lang="ts">
import darkLogo from '@/assets/images/shopflow-dark.svg?raw'
import lightLogo from '@/assets/images/shopflow-light.svg?raw'
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

const logo = computed(() =>
    theme.global.current.value.dark ? darkLogo : lightLogo
)
</script>

<template>
    <div class="app-logo" v-html="logo" />
</template>

<style scoped>
.app-logo {
    line-height: 0;
}
</style>
