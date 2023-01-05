<template>
    <main class="index">
        <div class="empty" v-if="!photos.length">
            <span>👀</span>
            Waiting for your first photo...
        </div>
        <nav>
            <div class="prev" v-if="prev" ref="prevLink">
                <router-link
                    :to="{name: 'page', params: { page: prev }}"
                    custom
                    v-slot="{ href }"
                >
                    <a :href="href" @click.prevent="fetchData(prev, -1)">
                        <span v-for="i in 3" :key="i">▲</span>
                        <span class="label">Newer</span>
                        <span v-for="i in 3" :key="i">▲</span>
                    </a>
                </router-link>
            </div>
        </nav>
        <ol class="posts">
            <li
                v-for="photo in photos"
                :key="photo.id"
                :id="`p${photo.id}`"
                :style="{backgroundColor: photo.color}"
            >
                <div
                    class="image"
                    :style="{borderColor: photo.contrast, color: photo.contrast}"
                >
                    <transition name="fade">
                        <a
                            :href="photo.fullURI"
                            v-if="photo"
                            target="_new"
                        >
                            <img
                                :src="photo.uri"
                                width="800"
                            >
                        </a>
                    </transition>
                    <span
                        v-if="photo"
                        class="weekday"
                    >{{ photo.day }}</span>
                    <span
                        v-if="photo"
                        class="date"
                    >{{ photo.date }}<br><span class="year">{{ photo.year }}</span></span>
                </div>
            </li>
        </ol>
        <nav>
            <div class="next" v-if="next">
                <router-link
                    :to="{name: 'page', params: { page: next }}"
                    custom
                    v-slot="{ href }"
                >
                    <a :href="href" @click.prevent="fetchData(next, 1)">
                        <span v-for="i in 3" :key="i">▼</span>
                        <span class="label">Older</span>
                        <span v-for="i in 3" :key="i">▼</span>
                    </a>
                </router-link>
            </div>
        </nav>
    </main>
</template>

<script setup>
import { ref, onBeforeUnmount, nextTick, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const API_URL = `${window.location.protocol}//${window.location.hostname}${import.meta.env.PROD ? '/api' : ':8000'}`
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const next = ref(null)
const photos = ref([])
const prev = ref(null)
const prevLink = ref()

function transform(p) {
    const date = new Date(p.day)
    p.day = DAYS[date.getUTCDay()]
    p.timestamp = new Date(p.timestamp)
    p.date = `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}`
    p.year = String(date.getUTCFullYear())
    p.uri = `/photos/${p.name}-800.jpg`
    p.fullURI = `/photos/${p.name}-1280.jpg`
    return p
}

async function fetchData(page = 1, append = 0) {
    const response = await fetch(`${API_URL}/q/${page}`)
    const data = await response.json()
    const newPhotos = data.photos.map(transform)
    if (append > 0) {
        photos.value = photos.value.concat(newPhotos)
        next.value = data.next
    } else if (append < 0) {
        startingPage = page
        photos.value = newPhotos.concat(photos.value)
        prev.value = data.prev
        const scrollHeight = window.innerHeight * newPhotos.length - prevLink.value.getBoundingClientRect().height
        await nextTick()
        // Scroll to where the user was to make it appear that the photos have loaded in above
        window.scrollTo(0, scrollHeight)
    } else {
        photos.value = newPhotos
        next.value = data.next
        prev.value = data.prev
        if (data.prev) {
            // Browsers don't allow `scrollTo` immediately, so wait a small amount
            await new Promise(res => setTimeout(res, 20))
            // Hide the previous link on load, but visible when scrolling up
            window.scrollTo(0, prevLink.value.getBoundingClientRect().height)
        }
    }
    setSelected()
}

// Grab updated photos
const route = useRoute()
const router = useRouter()
let startingPage = parseInt(route.params.page || 1)
fetchData(startingPage)
const activePage = ref(startingPage)

// Set changed photo on scroll
const active = ref(null)
function setSelected() {
    active.value = Math.floor(window.scrollY / window.innerHeight)
    activePage.value = startingPage + Math.floor(active.value / DAYS.length)
}
window.addEventListener('scroll', setSelected)
onBeforeUnmount(() => {
    window.removeEventListener('scroll', setSelected)
})

// Update chrome color when shown photo changes
const chrome = document.querySelector('meta[name="theme-color"]')
watchEffect(() => {
    if (active.value === null) return
    chrome.setAttribute('content', photos.value[active.value]?.color)
})
// Update URL when moving between pages
watch(activePage, page => {
    router.replace({ name: 'page', params: { page } })
})
</script>

<style lang="sass">
main.index
    width: 100%
    min-height: 100vh
    position: relative
    .posts
        a
            width: 100%
            padding-bottom: calc(100% / (800 / 600))
        a, img
            display: block
        img
            width: 100%
            position: absolute
        li
            background: black
            display: flex
            justify-content: center
            align-items: center
            width: 100%
            height: 100vh
            padding: 2em
        .image
            position: relative
            border: solid 1em white
            max-height: calc(600px + 2em)
            max-width: calc(800px + 2em)
            width: 100%
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
        a
            color: inherit
            display: flex
            text-decoration: none
            width: 100%
            align-items: center
            text-align: center
            justify-content: center
            height: 100%
            padding: 2em
            transition: background .5s
            user-select: none
            -webkit-tap-highlight-color: transparent
            &:active
                background-color: transparent
            &:hover
                background: rgba(255, 255, 255, .1)
                span
                    transform: scale(1.2)
        > div
            width: 100%
        span
            animation: fadecycle 1.4s infinite, colorcycle 1s infinite
            opacity: 0
            &:nth-child(2), &:nth-child(6)
                animation-delay: .2s
            &:nth-child(3), &:nth-child(5)
                animation-delay: .4s
        .label
            font-size: 1em
            opacity: 1
            padding: 0 2em
            animation: none

    .empty
        width: 100%
        position: absolute
        top: calc(50% - 4em)
        text-align: center
        color: #444
        span
            display: block
            font-size: 8em

@keyframes colorcycle
    0%
        color: #7ABF72cc
    25%
        color: #F4C65Acc
    50%
        color: #FC825Dcc
    75%
        color: #78BDC9cc
    100%
        color: #7ABF72cc

@keyframes fadecycle
    10%
        opacity: 1
    30%
        opacity: 0
</style>
