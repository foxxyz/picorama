<template>
    <main :class="['upload', {loading}]">
        <h1>Add Photo</h1>
        <transition name="toast">
            <div v-show="status.active" class="status">{{ status.message }}</div>
        </transition>
        <form :action="APIURL + '/add/'" method="post" encType="multipart/form-data" @submit.prevent="save">
            <div>
                <label>Photo</label>
                <input type="file" name="photo" accept="image/*" @change="fileAdded" required="true" />
            </div>
            <div>
                <label>Date</label>
                <input type="datetime-local" name="date" @change="dateChanged" :value="photoDate.toISOString().slice(0, -8)" required="true" />
            </div>
            <button type="submit" :disabled="loading">Add</button>
        </form>
    </main>
</template>

<script>
const API_URL = 'http://localhost:8000'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export default {
    data () {
        let now = new Date()
        return {
            APIURL: API_URL,
            file: null,
            // Subtract timezone offset since toISOString() ignores timezone
            photoDate: new Date(now.getTime() - now.getTimezoneOffset() * 60000),
            loading: false,
            status: { active: false, message: '' }
        }
    },
    methods: {
        clearStatus() {
            this.status.active = false
        },
        dateChanged(e) {
            let newDate = new Date(e.target.value)
            this.photoDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
        },
        fileAdded(e) {
            this.file = e.target.files[0]
        },
        save() {
            clearTimeout(this.$_statusTimeout)
            this.status.active = false
            this.loading = true
            let formData = new FormData()
            let xhr = new XMLHttpRequest()
            formData.append('date', this.photoDate.toISOString().slice(0, -8))
            formData.append('photo', this.file, this.file.name)
            xhr.open("POST", 'http://' + window.location.hostname + ":8000/add/", true)
            xhr.addEventListener('readystatechange', this.uploaded.bind(this, xhr))
            xhr.send(formData)
        },
        uploaded(xhr, e) {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                this.loading = false
                this.status.message = `Photo added for ${this.photoDate.toISOString().slice(0, 10)}`
                this.status.active = true
                this.$_statusTimeout = setTimeout(this.clearStatus, 5000)
            }
        }
    }
}
</script>

<style lang="sass">
main.upload
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    height: 100%
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
            margin-top: 2em

    form
        display: flex
        justify-content: center
        flex-direction: column
        align-items: center

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

.toast-enter
    transform: translate(0, -1em)
    opacity: 0

.toast-leave
    transform: translate(0, 1em)
    opacity: 0

.toast-enter-active, .toast-leave-active
    transition: all .5s
</style>