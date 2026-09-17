<template>
    <div>

        <CreateUser />

    </div>
</template>

<script setup lang="ts">
import CreateUser from '@/views/users/createUpdate.vue';

definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})

</script>

<style scoped></style>
