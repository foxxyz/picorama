export class API {
    url = `${window.location.protocol}//${window.location.hostname}${import.meta.env.PROD ? '/api' : ':8000'}`
    async query(path) {
        const response = await fetch(`${this.url}${path}`)
        const data = await response.json()
        return data
    }
}