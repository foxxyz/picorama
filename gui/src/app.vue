<template>
    <div class="app">
        <h1>
            <router-link to="/">
                <span
                    v-for="l in title"
                    :key="l"
                >{{ l }}</span>
            </router-link>
        </h1>
        <router-view v-slot="{ Component, route }">
            <transition :name="slide">
                <component
                    :is="Component"
                    :key="route.path"
                />
            </transition>
        </router-view>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const title = 'Picorama'

const slide = ref('')
const currentRoute = useRoute()
watch(() => ({ name: currentRoute.name, page: currentRoute.params.page }), (to, from) => {
    if (!from.name) {
        slide.value = ''
        return
    }
    if (!to.page) {
        slide.value = 'slide-left'
        return
    }
    slide.value = parseInt(to.page) < parseInt(from.page) ? 'slide-left' : 'slide-right'
})
</script>

<style lang="sass">
// Reset default styles
*
    margin: 0
    padding: 0
    box-sizing: border-box

// Always set color/background/font-size on root
body
    background: #000
    color: #eee
    font-size: 16px
    font-family: Prompt, Helvetica, Arial, sans-serif
    overflow-x: hidden

// Useful for single page apps to use up all available space
html, body
    height: 100%

// Reset some other default styles
input
    font-size: inherit
    font-family: inherit

// Font declarations would go here

.app
    font-family: "Prompt"
    > h1
        position: fixed
        right: 1rem
        top: 1rem
        text-transform: uppercase
        font-size: .6em
        z-index: 5
        color: #666
        width: 14em
        a
            display: flex
            justify-content: center
            flex-wrap: wrap
            perspective: 180px
            text-decoration: none
        span
            color: white
            margin: .3em
            width: 1.5em
            height: 1.5em
            display: flex
            justify-content: center
            align-items: center
            animation: cycle 2s infinite
            animation-fill-mode: forwards
            transition: filter 2s
            user-select: none
            &:nth-child(1), &:nth-child(5), &:nth-child(10)
                background: #F4C65Acc
                animation-delay: 0
            &:nth-child(2), &:nth-child(6), &:nth-child(9)
                background: #FC825Dcc
                animation-delay: .5s
            &:nth-child(3), &:nth-child(12), &:nth-child(8)
                background: #78BDC9cc
                animation-delay: 1s
            &:nth-child(4), &:nth-child(11), &:nth-child(7)
                background: #7ABF72cc
                animation-delay: 1.5s
            &:nth-child(6n + 1)
                transform: translateZ(1em) translateX(.5em) rotateY(20deg)
            &:nth-child(6n + 2)
                transform: translateZ(.32em) translateX(.2em) rotateY(12deg)
            &:nth-child(6n + 3)
                transform: translateZ(.032em) translateX(.02em) rotateY(4deg)
            &:nth-child(6n + 4)
                transform: translateZ(.032em) translateX(-.02em) rotateY(-4deg)
            &:nth-child(6n + 5)
                transform: translateZ(.32em) translateX(-.2em) rotateY(-12deg)
            &:nth-child(6n + 6)
                transform: translateZ(1em) translateX(-.5em) rotateY(-20deg)
            &:hover
                filter: contrast(3)
                transition: none

.slide-left-enter-active, .slide-left-leave-active, .slide-right-enter-active, .slide-right-leave-active
    position: absolute
    transition: transform .5s ease-in-out

.slide-left-enter-from, .slide-right-leave-to
    transform: translate(-100vw, 0)

.slide-left-leave-to, .slide-right-enter-from
    transform: translate(100vw, 0)

@keyframes cycle
    0%
        background: #7ABF72cc
    25%
        background: #F4C65Acc
    50%
        background: #FC825Dcc
    75%
        background: #78BDC9cc
    100%
        background: #7ABF72cc

</style>
