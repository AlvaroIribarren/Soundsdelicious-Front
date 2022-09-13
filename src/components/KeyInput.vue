<template>
  <div></div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { $bus } from './EventBus.js'

export default {
  name: 'Search',
  props: ['term'],
  watch: {
    volume () {
      this.setVolume()
    },
    audioVolume (vol) {
      $bus.$emit('setAudioVolume', vol)
    }
  },
  computed: {
    ...mapState(['playbackInfo']),

    videoNode () {
      return this.$refs['video']
    }
  },
  methods: {
    ...mapActions(['togglePlaybackInfoState']),

    UIBindings () {
      document.onkeypress = (e) => {
        // check for spacebar press
        if (e.keyCode === 32) {
          // check if an input is currently in focus
          if (!['input', 'textarea'].includes(document.activeElement.nodeName.toLowerCase())) {
            e.preventDefault()
            this.togglePlaybackInfoState()
          }
        }
      }
    }
  },
  created () {
    this.UIBindings()
  }
}
</script>

<style lang="stylus">
</style>
