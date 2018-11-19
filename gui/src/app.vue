<template>
	<router-view></router-view>
</template>

<script>
import './index.html'
export default {}
</script>

<style lang="sass">
    // Reset default styles
    *
        margin: 0
        padding: 0
        box-sizing: border-box

    // Always set color/background/font-size on root
    body
        background: #000
        color: #eee
        font-size: 16px
        font-family: Helvetica, Arial, sans-serif

    // Useful for single page apps to use up all available space
    html, body
        height: 100%

    // Reset some other default styles
    input
        font-size: inherit
        font-family: inherit

    // Font declarations would go here
</style>
