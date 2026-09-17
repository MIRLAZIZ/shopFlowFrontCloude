<script setup lang="ts">
defineProps<{
    loading?: boolean
    size?: number
    inline?: boolean
    white?: boolean
}>()
</script>

<template>
    <!-- inline = button ichida -->
    <template v-if="inline">
        <div class="spinner" :style="{ width: `${size ?? 18}px`, height: `${size ?? 18}px` }">
            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="sg-inline" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#38BDF8" />
                        <stop offset="50%" stop-color="#6366F1" />
                        <stop offset="100%" stop-color="#A855F7" />
                    </linearGradient>
                </defs>
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="4"
                    :stroke="white ? '#ffffff' : 'url(#sg-inline)'" />
            </svg>
        </div>
    </template>

    <!-- overlay = karta ustida -->
    <template v-else>
        <Transition name="fade">
            <div v-if="loading" class="loader-overlay">
                <div class="spinner" :style="{ width: `${size ?? 40}px`, height: `${size ?? 40}px` }">
                    <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="sg-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#38BDF8" />
                                <stop offset="50%" stop-color="#6366F1" />
                                <stop offset="100%" stop-color="#A855F7" />
                            </linearGradient>
                        </defs>
                        <circle cx="25" cy="25" r="20" fill="none" stroke-width="4" stroke="url(#sg-overlay)" />
                    </svg>
                </div>
            </div>
        </Transition>
    </template>
</template>

<style scoped>
.loader-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(2px);
    border-radius: inherit;
    z-index: 10;
}

:root.dark .loader-overlay {
    background: rgba(15, 20, 40, 0.6);
}

.spinner svg {
    animation: rotate 1.4s linear infinite;
}

.spinner circle {
    stroke-linecap: round;
    animation: dash 1.4s ease-in-out infinite;
}

@keyframes rotate {
    100% {
        transform: rotate(360deg);
    }
}

@keyframes dash {
    0% {
        stroke-dasharray: 1, 150;
        stroke-dashoffset: 0;
    }

    50% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -35;
    }

    100% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -124;
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
