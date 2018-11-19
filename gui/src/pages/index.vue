<template>
    <main>
        <h1><span v-for="l in title">{{ l }}</span></h1>
        <ol class="posts">
            <li v-for="photo in photos">
                <div class="image">
                    <transition name="fade">
                        <img v-if="photo" :src="photo.uri" width="800" />
                    </transition>
                    <span v-if="photo" class="weekday">{{ photo.day }}</span>
                    <span v-if="photo" class="date">{{ photo.date }}</span>
                </div>
            </li>
        </ol>
    </main>
</template>

<script>
const API_URL = 'http://localhost:8000'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default {
    data () {
        return {
            title: "Picorama",
            photos: Array(7)
        }
    },
    methods: {
        fetchData() {
            fetch(`${API_URL}/q/`)
                .then(res => res.json())
                .then(res => res.map(p => {
                    let date = new Date(p.day)
                    p.day = DAYS[date.getDay()]
                    p.timestamp = new Date(p.timestamp)
                    p.date = String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0')
                    p.uri = `photos/${p.name}-800.jpg`
                    return p
                }))
                .then(res => this.photos = res)
        }
    },
    created() {
        this.fetchData()
    }
}
</script>

<style lang="sass">
main
    font-family: "Prompt"
    h1
        position: fixed
        right: 1em
        top: 1em
        text-transform: uppercase
        display: flex
        font-size: .6em
        z-index: 5
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
    .posts
        img
            display: block
        li
            background: black
            display: flex
            justify-content: center
            align-items: center
            width: 100vw
            height: 100vh
        .image
            position: relative
            border: solid 1em white
            max-height: calc(600px + 2em)
            span
                position: absolute
                text-transform: uppercase
                font-size: 2em
            .weekday
                bottom: -1.8em
                left: 0
            .date
                bottom: -1.8em
                right: 0

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

.fade-enter-active, .fade-leave-active
  transition: opacity .5s

.fade-enter, .fade-leave-to
  opacity: 0

</style>
