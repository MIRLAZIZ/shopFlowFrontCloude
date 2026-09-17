<template>
    <div>

        <EditProduct />


    </div>
</template>

<script setup lang="ts">
import EditProduct from '@/views/product/add/index.vue';
import { useRoute } from 'vue-router';
const route = useRoute()

definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})

</script>

<style scoped></style>
