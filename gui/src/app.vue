<template>
    <div class="app">
        <h1>
            <router-link to="/" custom v-slot="{ href }">
                <a :href="href">
                    <span
                        v-for="l in title"
                        :key="l"
                    >{{ l }}</span>
                </a>
            </router-link>
        </h1>
        <router-view />
    </div>
</template>

<script setup>
const title = 'Picorama'
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
        width: 10em
        a
            display: flex
            justify-content: flex-end
            text-decoration: none
            flex-wrap: wrap
        span
            color: white
            margin: .3em
            width: 1.5em
            height: 1.5em
            display: flex
            justify-content: center
            align-items: center
            animation: cycle 2s infinite, rotate 8s ease-out infinite
            animation-fill-mode: forwards
            transition: filter 2s
            user-select: none
            &:nth-child(1), &:nth-child(5)
                background: #F4C65Acc
                animation-delay: 0s, calc(random(6) / 6) + s
            &:nth-child(2), &:nth-child(6)
                background: #FC825Dcc
                animation-delay: .5s, calc(random(6) / 6) + s
            &:nth-child(3), &:nth-child(7)
                background: #78BDC9cc
                animation-delay: 1s, calc(random(6) / 6) + s
            &:nth-child(4), &:nth-child(8)
                background: #7ABF72cc
                animation-delay: 1.5s, calc(random(6) / 6) + s
            &:hover
                filter: contrast(3)
                transition: none

    @media print
        h1
            display: none

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

@keyframes rotate
    80%
        transform: rotate(0)
    100%
        transform: rotate(360deg)

</style>
