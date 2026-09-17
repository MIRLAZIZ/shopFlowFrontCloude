<template>
    <div>

        <EditBatch />


    </div>
</template>

<script setup lang="ts">
import EditBatch from '@/views/product/batchs/index.vue';

definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})

</script>

<style scoped></style>
