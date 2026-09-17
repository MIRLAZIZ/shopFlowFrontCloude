<template>
    <div>

        <CreateBatch />


    </div>
</template>

<script setup lang="ts">
import CreateBatch from '@/views/product/batchs/index.vue';

definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})

</script>

<style scoped></style>
