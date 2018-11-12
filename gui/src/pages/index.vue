<template>
    <main>
        <h1><span v-for="l in title">{{ l }}</span></h1>
    </main>
</template>

<script>
export default {
    data () {
        return {
            title: "Picorama"
        }
    }
}
</script>

<style lang="sass">
main
    display: flex
    justify-content: center
    align-items: center
    height: 100%
    background: #333
    h1
        text-transform: uppercase
        font-family: "Prompt"
        display: flex
        font-size: 2em
        justify-content: center
        color: #666
        flex-wrap: wrap
        width: 14em
        perspective: 180px
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
