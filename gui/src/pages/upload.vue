<template>
    <main class="upload">
        <h1>Add Photo</h1>
        <form :action="APIURL + '/add/'" method="post" encType="multipart/form-data" @submit.prevent="save">
            <div>
                <label>Photo</label>
                <input type="file" name="photo" accept="image/*" @change="fileAdded" required="true" />
            </div>
            <div>
                <label>Date</label>
                <input type="datetime-local" name="date" @change="dateChanged" :value="photoDate.toISOString().slice(0, -8)" required="true" />
            </div>
            <button type="submit">Add</button>
        </form>
    </main>
</template>

<script>
const API_URL = 'http://localhost:8000'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function FileUpload(file) {
    var reader = new FileReader()
    
    this.xhr = xhr

    var self = this
    this.xhr.upload.addEventListener("progress", function(e) {
        if (e.lengthComputable) {
            var percentage = Math.round((e.loaded * 100) / e.total)
        }
    }, false)

    xhr.upload.addEventListener("load", function(e){
        console.log('log')
    }, false)
    
    reader.onload = function(evt) {
        xhr.send(evt.target.result)
    }
    reader.readAsBinaryString(file)
}

export default {
    data () {
        let now = new Date()
        return {
            APIURL: API_URL,
            file: null,
            // Subtract timezone offset since toISOString() ignores timezone
            photoDate: new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        }
    },
    methods: {
        dateChanged(e) {
            let newDate = new Date(e.target.value)
            this.photoDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
        },
        fileAdded(e) {
            this.file = e.target.files[0]
        },
        save() {
            console.log('save', this.file, this.photoDate)
            let formData = new FormData()
            let xhr = new XMLHttpRequest()
            formData.append('date', this.photoDate.toISOString().slice(0, -8))
            formData.append('photo', this.file, this.file.name)
            xhr.open("POST", "http://192.168.1.5:8000/add/")
            xhr.send(formData)
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

    h1
        margin-bottom: .5em
        font-size: 3em
</style>