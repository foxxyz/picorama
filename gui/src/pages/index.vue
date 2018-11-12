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
    perspective: 180px
    h1
        text-transform: uppercase
        font-family: "Prompt"
        display: flex
        font-size: 2em
        justify-content: center
        color: #666
        flex-wrap: wrap
        width: 14em
        span
            color: white
            margin: .3em
            width: 1.5em
            height: 1.5em
            display: flex
            justify-content: center
            align-items: center
            animation: cycle 2s infinite
            &:nth-child(4n + 1)
                background: #4281a4
                animation-delay: 0
            &:nth-child(4n + 2)
                background: #f2c14e
                animation-delay: .5s
            &:nth-child(4n + 3)
                background: #f78154
                animation-delay: 1s
            &:nth-child(4n + 4)
                background: #4d9078
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

@keyframes cycle
    0%
        background: #4281a4
    25%
        background: #f2c14e
    50%
        background: #f78154
    75%
        background: #4d9078
    100%
        background: #4281a4

@keyframes fade
    50%
        opacity: 0
</style>
