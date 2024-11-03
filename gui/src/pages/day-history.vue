<template>
    <main class="day-history">
        <header>
            <h2>{{ format(historyDay, 'MMM do') }}</h2>
        </header>
        <ol>
            <li
                v-for="photo in photos"
                :key="photo.id"
                :style="{ backgroundColor: photo.color, color: photo.color }"
            >
                <span class="year" :style="{ textShadow: `2px 2px 0 ${photo.contrast}` }">
                    {{ photo.year }}
                </span>
                <div
                    class="image"
                    :style="{borderColor: photo.color}"
                >
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
                </div>
            </li>
        </ol>
    </main>
</template>

<script setup>
import { format, getDayOfYear, setDayOfYear, setYear } from 'date-fns'
import { inject, ref } from 'vue'
import { useRoute } from 'vue-router'

const api = inject('api')

const photos = ref([])
async function fetchData(historyDay) {
    const year = historyDay.getUTCFullYear()
    const dayOfYear = getDayOfYear(historyDay)
    const data = await api.query(`/history/${year}/${dayOfYear}`)
    photos.value = data.photos.map(p => {
        const date = new Date(p.day)
        p.year = String(date.getUTCFullYear())
        p.uri = `/photos/${p.name}-800.jpg`
        p.fullURI = `/photos/${p.name}-1280.jpg`
        return p
    })
}
// Grab updated photos
const route = useRoute()

// Allow date override
let historyDay = new Date()
if (route.params.year) historyDay = setYear(historyDay, route.params.year)
if (route.params.day) historyDay = setDayOfYear(historyDay, route.params.day)
fetchData(historyDay)

// Check every minute if we've passed the day boundary and reload if so
let lastCheck = new Date()
setInterval(() => {
    const now = new Date()
    if (lastCheck.getDate() !== now.getDate()) {
        document.location.reload()
    }
    lastCheck = now
}, 60 * 1000)
</script>

<style lang="sass">
main.day-history
    width: 100%
    header
        padding: 0 1rem
        font-size: 2em
        text-transform: uppercase
    img
        display: block
        width: 100%
    li
        padding: .5rem
        flex-grow: 1
        width: 20em
        position: relative
    ol
        display: flex
        flex-wrap: wrap
        list-style: none
        &:has(> :nth-child(n+4))
            li
                height: 50%
                width: 50vw
        &:has(> :nth-child(n+5))
            li
                width: 30em
        &:has(> :nth-child(n+9))
            li
                width: 20em
        &:has(> :nth-child(n+13))
            li
                height: calc(100% / 3)
    .year
        font-size: 3em
        position: absolute
        font-weight: bold
        bottom: 0
        right: .5em
        opacity: .3

    // When printing (to paper or screen, such as a TV)
    // Fill the whole screen and hide the header
    @media print
        height: 100vh
        display: flex
        flex-direction: column
        div.image
            width: 100%
            height: 100%
            a
                width: 100%
                height: 100%
                display: block
        header
            display: none
        img
            height: 100%
            object-fit: cover
        li
            height: 100%
        ol
            flex-grow: 1
            min-height: 0

</style>