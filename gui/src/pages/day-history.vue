<template>
    <main class="day-history">
        <header>
            <h2>{{ format(today, 'MMM do') }}</h2>
        </header>
        <ol>
            <li
                v-for="photo in photos"
                :key="photo.id"
                :style="{backgroundColor: photo.color, color: photo.contrast}"
            >
                <span class="year">
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
import { format, getDayOfYear, setDayOfYear } from 'date-fns'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const API_URL = `${window.location.protocol}//${window.location.hostname}${import.meta.env.PROD ? '/api' : ':8000'}`

const photos = ref([])
async function fetchData(dayOfYear) {
    const response = await fetch(`${API_URL}/history/${dayOfYear}`)
    const data = await response.json()
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

let today = new Date()
if (route.params.day) today = setDayOfYear(today, route.params.day)
fetchData(getDayOfYear(today))
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
        width: 14em
    li
        display: flex
        padding: 1rem
        justify-content: space-between
        align-items: center
        width: 28em
        flex-grow: 1
    ol
        display: flex
        flex-wrap: wrap
    .image
        //border: solid .5em
    .year
        font-size: 4em
        font-weight: bold
        display: flex
        justify-content: center
        align-items: center
        flex-grow: 1
        max-width: 14em
</style>