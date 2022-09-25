<template>
  <div class="general-music-player">
    <div class="container">
      <div class="play-pause-music-player">
        <div class="icon" ref="playButton" @click="triggerPlayPause()">
          <div v-show="!this.isPlaying" class="i-play">
            <i class="material-icons">play_arrow</i>
          </div>
          <div v-show="this.isPlaying" class="i-pause">
            <i class="material-icons">pause</i>
          </div>
        </div>
      </div>
      <div class="titles_container">
        <div class="song_title">
          <strong> 
            {{ this.song ? this.song.title : "Song name" }} 
          </strong>
        </div>
        <div class="song_title">
          {{ this.song.artist }}
        </div>
      </div>
      <div>
        <div class="wavesurfer-container" v-show="this.currentLoadingPercentage === 100">
          <div id="player" class="wavesurfer"></div>
        </div>
        <div v-show="this.currentLoadingPercentage < 100" class="progress">
          <b-progress 
            :value="this.currentLoadingPercentage" 
            :variant="this.loadingError ? 'danger' : ''"
            :max=100 
            show-progress 
            animated
          />
        </div>
      </div>
      <div class="timer" v-show="this.currentLoadingPercentage === 100">
        <div class="actual-duration">
          {{ this.currentTime === 0 ? '00:00' : this.currentTime }}
        </div>
        <div>
          /
        </div>
        <div class="player-duration">
          {{ this.getDuration() }}
        </div>
      </div>
      <div class="volume-controller">
        <i class="material-icons volume-up">volume_up</i>
        <input 
          class="slider-volume" 
          type="range" 
          min="0" 
          max="1.0" 
          step="0.01" 
          v-model="vol" 
          style="padding:0;" 
        />
      </div>
      <div class="interact-music-player">
        <b-dropdown variant="none" no-caret>
          <template v-slot:button-content>
            <i class="material-icons download_icon">get_app</i>
          </template>
          <div class="b-dropdown-item">
            <a download target="_blank" @click.prevent="dl('mp3')" title="Download This Audio File">Download MP3</a>
          </div>
          <div class="b-dropdown-item">
            <a download target="_blank" @click.prevent="dl('wav')" title="Download This Audio File">Download WAV</a>
          </div>
          <!-- <div class="b-dropdown-item" v-show="song.has_stems">
            <a download target="_blank" @click.prevent="dl('zip')" title="Download All Stems (.zip)" class="m-hide">Download Stems</a>
          </div> -->
        </b-dropdown>
      </div>
    </div>

  </div>
</template>


<script>
import wavesurfer from 'wavesurfer.js'
import { BProgress, BDropdown } from 'bootstrap-vue'
import { $bus } from './EventBus.js'
import { mapActions } from 'vuex'

export default {
  name: 'music-player',
  components: {
    'b-progress': BProgress,
    'b-dropdown': BDropdown
  },
  data () {
    return {
      wave: '',
      isPlaying: true,
      currentTime: '00:00',
      currentLoadingPercentage: 0,
      loadingError: false,
      meta: {
        playedOnce: false,
        isDownloadDropVisible: false,
        songsDir: `//${window.location.hostname === 'localhost' ? 'localhost:3030' : 'api.soundsdeliciousmusiclibrary.com'}/songs`,
        currentDownload: {
          wav: '',
          mp3: ''
        },
        duration: '00:00',
        usesWav: false,
        toLoad: ''
      }
    }
  },
  props: ['song', 'wavePlaying', 'vol'],
  watch: {
    song: function (newVal, oldVal) {
      this.currentLoadingPercentage = 0
      this.loadingError = false
      this.song = newVal
      this.wave.destroy()
      this.wave = this.createTrack()
      this.loadTrack()
      this.wave.play()
    },
    vol: function (newVal, oldVal) {
      this.vol = newVal
      this.wave.setVolume(this.vol)
    }
  },
  computed: {
  },
  methods: {
    ...mapActions(['setPlaybackInfo']),

    link (suffix) {
      return `${this.meta.songsDir}/${this.song.title}/${this.song.title}${suffix}`
    },
    createTrack () {
      return wavesurfer.create({
        container: '#player',
        height: 26,
        backend: 'MediaElement',
        waveColor: '#dbe6e8',
        progressColor: '#2433D9',
        backgroundColor: 'transparent',
        barWidth: 2,
        fillParent: true
      })
    },
    getProgressVariant () {
      if (this.loadingError) return 'error'
      else return 'success'
    },
    triggerPlayPause () {
      if (this.isPlaying) {
        this.setPlaybackInfo({ state: 'pause', current: this.song.num_id })
      } else {
        this.setPlaybackInfo({ state: 'play', current: this.song.num_id })
      }

      if (this.isPlaying) this.pause()
      else this.play()
    },
    play () {
      this.wave.play()
      this.isPlaying = true
    },
    pause () {
      this.isPlaying = false
      if (this.wave.isPlaying()) {
        this.wave.pause()
      }
    },
    loadTrack () {
      const path = this.link('.mp3')
      const pathWav = path.replace('mp3', 'wav')
      // set track length
      // this.meta.duration = this.secondsToDuration(this.song.length)
      // set download path
      this.meta.currentDownload.wav = `${pathWav}?dl=1`
      this.meta.currentDownload.mp3 = `${path}?dl=1`
      // Pause the song if it's playing before switching
      if (this.isPlaying) this.pause()
      // Position is reset
      this.meta.playedOnce = false
      this.toLoad = this.meta.usesWav ? pathWav : path

      this.wave.load(path)

      this.wave.on('ready', () => {
        const s = Math.floor(this.wave.getDuration())
        this.meta.duration = this.secondsToDuration(s)
        this.wave.setVolume(this.vol)
        this.triggerPlayPause()
        this.currentLoadingPercentage = 100
      })
      this.wave.on('play', () => {
      })
      this.wave.on('pause', () => {
      })
      this.wave.on('loading', (percentage) => {
        this.currentLoadingPercentage = percentage
      })
      this.wave.on('error', () => {
        if (!this.meta.usesWav) {
          console.log(`Broken MP3: ${path}`)
          this.meta.usesWav = true
          this.loadTrack()
        } else {
          this.loadingError = true
        }
      })
      this.wave.on('audioprocess', () => {
        if (this.wave.isPlaying()) {
          this.currentTime = this.secondsToDuration(Math.round(this.wave.getCurrentTime()))
        }
      })
    },
    secondsToDuration (s) {
      return s > 0 ? Math.floor(s / 60).toString().padStart(2, '0') + ':' + (s % 60).toString().padStart(2, '0') : 0
    },
    getDuration () {
      if (this.wave) return this.secondsToDuration(Math.floor(this.wave.getDuration()))
      else return this.wave.duration
    },
    dl (ext) {
      if (this.$auth.check()) {
        const link = this.meta.currentDownload[ext] || this.link('.' + ext)
        this.axios.post('/auth/dl/trc', { title: this.song.title })
        window.open(link, '_blank')
      } else {
        $bus.$emit('auth_open', 'download')
      }
    }
    // loadTrackInMemory () {
    //   if (this.wave.isDestroyed) {
    //     this.wave = this.createTrack()
    //     this.loadTrack()
    //   }

    //   if (!this.meta.isPlaying && !this.songIsLoaded) {
    //     this.wave.load(this.toLoad)
    //     this.$emit('songsLoadedAdd', { wave: this.wave, num_id: this.song.num_id })
    //   }
    // },
  },
  mounted () {
    this.wave = this.createTrack()
    this.loadTrack()
  },
  unmounted () {

  }
}
</script>

<style>
  @import '../css/MusicPlayer.css';
</style>