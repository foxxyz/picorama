<template>
    <main class="index">
        <ol class="posts">
            <li v-for="photo in photos" :style="{backgroundColor: photo.color}">
                <div class="image" :style="{borderColor: photo.contrast, color: photo.contrast}">
                    <transition name="fade">
                        <a :href="photo.fullURI" v-if="photo" target="_new">
                            <img :src="photo.uri" width="800" />
                        </a>
                    </transition>
                    <span v-if="photo" class="weekday">{{ photo.day }}</span>
                    <span v-if="photo" class="date">{{ photo.date }}<br/><span class="year">{{ photo.year }}</span></span>
                </div>
            </li>
        </ol>
        <nav>
            <div class="prev"><router-link v-if="prev" :to="{name: 'page', params: { page: prev }}">Prev</router-link></div>
            <div class="next"><router-link v-if="next" :to="{name: 'page', params: { page: next }}">Next</router-link></div>
        </nav>
    </main>
</template>

<script>
const API_URL = window.location.origin + (PRODUCTION ? '/api' : ':8000')
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default {
    data () {
        return {
            next: null,
            photos: [],
            prev: null
        }
    },
    methods: {
        fetchData(page=1) {
            fetch(`${API_URL}/q/${page}`)
                .then(res => res.json())
                .then(res => {
                    this.next = res.next
                    this.prev = res.prev
                    this.photos = res.photos.map(p => {
                        let date = new Date(p.day)
                        p.day = DAYS[date.getUTCDay()]
                        p.timestamp = new Date(p.timestamp)
                        p.date = String(date.getUTCMonth() + 1).padStart(2, '0') + '/' + String(date.getUTCDate()).padStart(2, '0')
                        p.year = String(date.getUTCFullYear())
                        p.uri = `/photos/${p.name}-800.jpg`
                        p.fullURI = `/photos/${p.name}-1280.jpg`
                        return p
                    })
                })
        }
    },
    created() {
        this.fetchData(this.$route.params.page)
    },
    watch: {
        $route() {
            this.fetchData(this.$route.params.page)
        }
    }
}
</script>

<style lang="sass">
main.index
    width: 100%
    .posts
        a, img
            display: block
        img
            width: 100%
        li
            background: black
            display: flex
            justify-content: center
            align-items: center
            width: 100%
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
            .year
                font-size: .5em
                opacity: .2
                width: 100%
                text-align: right
                margin-top: -.8em
    nav
        position: fixed
        top: 0
        left: 0
        height: 100%
        width: 100%
        display: flex
        pointer-events: none
        text-transform: uppercase
        justify-content: space-between
        a
            color: inherit
            display: flex
            align-items: flex-end
            text-decoration: none
            width: 100%
            height: 100%
            padding: 1em
            transition: background .5s
            &:hover
                background: rgba(255, 255, 255, .1)
        div
            width: 5em
            pointer-events: all
        .next a
            justify-content: flex-end

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
