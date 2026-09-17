<template>
    <div>

        <CreateProcuct />

    </div>
</template>

<script setup lang="ts">
import CreateProcuct from '@/views/product/add/index.vue';
definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})

</script>

<style scoped></style>
