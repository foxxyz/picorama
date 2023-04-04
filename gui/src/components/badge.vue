<template>
    <div class="badge" :style="{ '--color': color }">
        <span>{{ value }}</span>
        <span>{{ unitPlural }}</span>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    color: {
        type: String,
        default: '#F4C65A'
    },
    value: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true
    }
})

const unitPlural = computed(() => props.value > 1 ? `${props.unit}s` : props.unit)
</script>

<style lang="sass">
.badge
    position: absolute
    color: white
    right: -1.8em
    top: -1.8em
    width: 3.6em
    height: 3.6em
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    font-size: 2em
    text-transform: uppercase
    transform: rotate(10deg)
    &:after
        content: ''
        display: block
        position: absolute
        clip-path: polygon(100.00% 50.00%,90.50% 56.41%,97.55% 65.45%,86.53% 68.61%,90.45% 79.39%,78.99% 78.99%,79.39% 90.45%,68.61% 86.53%,65.45% 97.55%,56.41% 90.50%,50.00% 100.00%,43.59% 90.50%,34.55% 97.55%,31.39% 86.53%,20.61% 90.45%,21.01% 78.99%,9.55% 79.39%,13.47% 68.61%,2.45% 65.45%,9.50% 56.41%,0.00% 50.00%,9.50% 43.59%,2.45% 34.55%,13.47% 31.39%,9.55% 20.61%,21.01% 21.01%,20.61% 9.55%,31.39% 13.47%,34.55% 2.45%,43.59% 9.50%,50.00% 0.00%,56.41% 9.50%,65.45% 2.45%,68.61% 13.47%,79.39% 9.55%,78.99% 21.01%,90.45% 20.61%,86.53% 31.39%,97.55% 34.55%,90.50% 43.59%)
        background: var(--color)
        width: 100%
        height: 100%
        top: 0
        left: 0
        animation: rotate 12s linear infinite
    span
        position: relative
        line-height: .9em
        z-index: 5
        text-shadow: .1em .1em .1em #00000033
        &:nth-child(1)
            font-weight: 700
        &:nth-child(2)
            font-size: .6em
            font-weight: 500

@keyframes rotate
    to
        transform: rotate(359deg)
</style>