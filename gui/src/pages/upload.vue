<template>
    <main :class="['upload', {loading}]">
        <h1>Add Photo</h1>
        <transition name="toast">
            <div
                v-show="status.active"
                class="status"
            >
                {{ status.message }}
            </div>
        </transition>
        <form
            :action="API_URL + '/add/'"
            method="post"
            encType="multipart/form-data"
            @submit.prevent="save"
        >
            <div>
                <label>Photo</label>
                <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    @change="fileAdded"
                    required="true"
                >
            </div>
            <div>
                <label>Date</label>
                <input
                    type="datetime-local"
                    name="date"
                    @change="dateChanged"
                    :value="photoDate.toISOString().slice(0, -8)"
                    required="true"
                >
            </div>
            <div>
                <label>Auth Code</label>
                <input
                    name="auth"
                    required="true"
                    placeholder="Auth Code"
                    v-model="authCode"
                >
            </div>
            <button
                type="submit"
                :disabled="loading"
            >
                Add
            </button>
        </form>
    </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { genSalt, hash } from 'bcryptjs'

const API_URL = 'http://localhost:8000'
const MINUTE = 60000
const STATUS_OK = 200

const file = ref(null)
// Subtract timezone offset since toISOString() ignores timezone
const now = new Date()
const photoDate = ref(new Date(now.getTime() - now.getTimezoneOffset() * MINUTE))
const loading = ref(false)
const status = reactive({
    active: false,
    message: ''
})

function clearStatus() {
    status.active = false
}
function dateChanged(e) {
    const newDate = new Date(e.target.value)
    photoDate.value = new Date(newDate.getTime() - newDate.getTimezoneOffset() * MINUTE)
}
function fileAdded(e) {
    file.value = e.target.files[0]
}

let statusTimeout
const authCode = ref('')
async function save() {
    clearTimeout(statusTimeout)
    status.active = false
    loading.value = true

    // Set data
    const body = new FormData()
    body.append('date', photoDate.value.toISOString().slice(0, -8))
    body.append('photo', file.value, file.value.name)

    // Hash auth code
    const salt = await genSalt(10)
    const token = await hash(authCode.value, salt)

    const res = await fetch(`http://${window.location.hostname}:8000/add/`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body
    })

    loading.value = false
    if (res.status === STATUS_OK) {
        status.message = `Photo added for ${photoDate.value.toISOString().slice(0, 10)}`
    }
    else {
        status.message = `Unable to save! (Status: ${res.status})`
    }
    status.active = true
    statusTimeout = setTimeout(clearStatus, 5000)
}
</script>

<style lang="sass">
main.upload
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    height: 100vh
    transition: opacity 1s

    &.loading
        opacity: .2

    button
        background-color: #78BDC9cc
        font-family: inherit
        color: white
        padding: .2em .5em
        border: none
        text-transform: uppercase
        font-size: 1.2em
        box-shadow: .3em .3em .1em rgba(255, 255, 255, .3)

        &[type=submit]
            margin-top: 1.5em

    form
        display: flex
        justify-content: center
        flex-direction: column
        align-items: center
        > div
            margin-bottom: 1em

    h1
        margin-bottom: .5em
        font-size: 3em
        text-transform: uppercase
        text-shadow: 0 .1em .1em rgba(255, 255, 255, .3)

    input
        width: 13em

    label
        display: none

    .status
        position: absolute
        top: 1em
        left: 50%
        background: #7ABF72cc
        padding: .2em 1em
        margin-bottom: 1em
        width: 20em
        margin-left: -10em
        text-align: center
        box-shadow: .3em .3em .1em rgba(255, 255, 255, .3)

.toast-enter-from
    transform: translate(0, -1em)
    opacity: 0

.toast-leave-from
    transform: translate(0, 1em)
    opacity: 0

.toast-enter-active, .toast-leave-active
    transition: all .5s
</style>