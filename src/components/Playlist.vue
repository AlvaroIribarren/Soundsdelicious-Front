<template>
  <div class="playlist" v-if="isVisible">
    <router-link
      :to="{ path: '/', query: { play: code } }"
      class="button--popout"
      v-if="!isViewingPlaylist"
    ><span>
      <i class="material-icons">view_headline</i>
      Go to Playlist</span></router-link>
    <button
      class="button--popout"
      v-if="isViewingPlaylist"
      v-clipboard:copy="url"
      v-clipboard:success="copied"
    ><span>
      <i class="material-icons">view_headline</i>
      {{ hasJustCopied ? "Copied to Clipboard!" : "Save Playlist Link" }}</span></button>
  </div>
</template>

<script>
export default {
  name: 'Playlist',
  props: ['playlist', 'isViewingPlaylist'],
  data () {
    return {
      hasJustCopied: false
    }
  },
  computed: {
    isVisible () {
      return this.playlist.length > 0
    },

    /**
     * Generate the encoded string for a given playlist selection
     */
    code () {
      return this.playlist.map(id => id.toString(36)).join('-')
    },

    /**
     * Generate URL for encoded playlist
     */
    url () {
      return `${window.location.origin}/?play=${this.code}`
    }
  },
  methods: {
    /**
     * Return loaded playlist from URL
     */
    load () {
      const { search } = window.location
      if (!search.includes('play=')) return []
      const code = search.split('?play=')[1]
      const playlist = code.split('-').map(idCode => parseInt(idCode, 36))
      return playlist
    },

    /**
     * Trigger on copy success
     */
    copied () {
      this.hasJustCopied = true
      setTimeout(() => {
        this.hasJustCopied = false
      }, 1000)
    }
  }
}
</script>

<style lang="stylus" scoped>
.playlist
  display flex
  margin 1em auto
  padding 0 1em
  max-width 40em
  justify-content center

  input
    margin-right 1em
    width 20em
    border-color #dde0e1
    display block
    flex 3
    padding .25em 1em

  button
    min-width auto
    display block
</style>
