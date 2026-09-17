<template>
    <div>
        <UpdateUser />
    </div>
</template>

<script setup lang="ts">
import UpdateUser from '@/views/users/createUpdate.vue';

definePage({
    meta: {
        action: 'read',
        subject: 'SecondPage',
    },
})

</script>
