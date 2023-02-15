<template>
  <div class="video-sync">
    <div class="wrap">
      <div class="interact-cards">
        <label
          class="interact-card interact-card--hoverable"
          v-show="!isPlayable"
        >
          <span class="interact-card__title"
            ><i class="material-icons">publish</i>Video Sync</span
          >
          <span class="interact-card__hover-content"
            >Sync your videos and test out songs. Your videos will not be saved
            or uploaded anywhere.</span
          >
          <input
            class="file-input"
            type="file"
            accept="video/*,.mov,.mp4"
            @change="loadVideo"
            ref="videoInput"
          />
        </label>
        <div class="interact-card interact-card--video" v-show="isPlayable">
          <video class="video" ref="video"></video>
          <div
            class="video-restart"
            v-show="isPlayable"
            @click="restartVideoFromBeginning"
          ></div>
          <div class="interact-card__notice">
            <span @click="resetVideo">Back to Search</span>
          </div>
        </div>
        <div class="interact-card interact-card--tertiary">
          <div class="volume-control">
            <div class="volume-control__title">
              <i class="material-icons">audiotrack</i>Music
            </div>
            <div class="volume-control__slider">
              <i class="material-icons">volume_up</i>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                v-model="audioVolume"
                @change.prevent="setRangeBg"
              />
            </div>
          </div>
          <div class="volume-control">
            <div class="volume-control__title">
              <i class="material-icons">movie</i>Video
            </div>
            <div class="volume-control__slider">
              <i class="material-icons">volume_up</i>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                v-model="volume"
                @change.prevent="setRangeBg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import { $bus } from "./EventBus.js";

export default {
  name: "Search",
  props: ["term"],
  data() {
    return {
      isVSVisible: false,
      isPlayable: false,
      volume: 100,
      audioVolume: 100,
      lastPlayingId: null
    };
  },
  watch: {
    playbackInfo(currentPlaybackInfo) {
      if (
        currentPlaybackInfo.state === "play" &&
        currentPlaybackInfo.current !== this.lastPlayingId
      ) {
        // reset video to beginning every time a new song is played
        this.lastPlayingId = currentPlaybackInfo.current;
        this.videoNode.currentTime = 0;
      }
      this.videoNode[currentPlaybackInfo.state]();
    },
    volume() {
      this.setVolume();
    },
    audioVolume(vol) {
      $bus.$emit("setAudioVolume", vol);
    }
  },
  mounted() {},
  computed: {
    ...mapState(["playbackInfo"]),

    videoNode() {
      return this.$refs["video"];
    }
  },
  methods: {
    ...mapActions(["setPlaybackInfo"]),

    // toggle video sync widget visibility
    showVS() {
      this.isVSVisible = true;
    },

    // load video from file
    loadVideo(e) {
      const file = e.target.files[0];
      let type = file.type;
      let canPlay = type.includes("video/") || this.videoNode.canPlayType(type);
      if (!canPlay) {
        return false;
      }
      this.isPlayable = true;
      const fileURL = URL.createObjectURL(file);
      this.videoNode.src = fileURL;
    },

    restartVideoFromBeginning() {
      this.videoNode.pause();
      this.videoNode.currentTime = 0;
      this.videoNode.play();
    },

    resetVideo() {
      this.videoNode.pause();
      this.videoNode.removeAttribute("src");
      this.videoNode.load();
      this.isPlayable = false;
    },

    setVolume() {
      if (!this.$refs["video"]) return false;
      this.$refs["video"].volume = this.volume / 100;
    },

    setRangeBg(e) {
      const el = e.target;
      const val = ((el.value - el.min) / (el.max - el.min)).toFixed(2) * 100;
      el.style.background =
        "linear-gradient(to right, #F782AA 0%, " +
        "#F782AA " +
        val +
        "%, " +
        "#F782AA80 " +
        val +
        "%, " +
        "#F782AA80 100%)";
    }
  }
};
</script>

<style lang="stylus" scoped>
label.interact-card
  cursor pointer
  position relative
  span
    cursor pointer
    display block

.video-sync
  text-align center

.video-restart
  position absolute
  cursor pointer
  bottom 0
  left 0
  border .5em solid transparent
  border-left-color #fff860
  border-bottom-color @border-left-color
  z-index 100

.file-input
  opacity 0
  position absolute

.file-input, .video, .btn--show
  display block
  margin .5em auto

.volume-control
  font-weight bold

.volume-control__slider
  display flex
  align-items center
  margin 0 1em
  input
    height 2px
    margin-top .5em

input[type="range"]
  padding 0

.video
  max-width 30em

i
  font-size 1.25em !important

// Progress Bar Styles START
$track-color = #F782AA
$thumb-color = #fff

$thumb-radius = 20px
$thumb-height = 12px
$thumb-width = 12px
$thumb-border-width = 2px
$thumb-border-color = #F782AA

$track-width = 100%
$track-height = 2px

$track-radius = 5px
$contrast = 20%

track()
  width: $track-width
  height: $track-height
  cursor: pointer

thumb()
  border: $thumb-border-width solid $thumb-border-color
  height: $thumb-height
  width: $thumb-width
  border-radius: $thumb-radius
  background: $thumb-color
  cursor: pointer

input[type=range]
  -webkit-appearance: none
  margin: $thumb-height/2 0
  width: $track-width
  border none
  background: $track-color

  &:focus
    outline: none

  &::-webkit-slider-runnable-track
    track()
    border-radius: $track-radius

  &::-webkit-slider-thumb
    thumb()
    -webkit-appearance: none
    margin-top: -($thumb-height / 2)

  &::-moz-range-track
    track()
    border-radius: $track-radius

  &::-moz-range-thumb
    thumb()

  &::-ms-track
    track()
    background: transparent
    border-color: transparent
    border-width: $thumb-width 0
    color: transparent

  &::-ms-fill-lower
    background: $track-color
    border: $track-border-width solid $track-border-color
    border-radius: $track-radius*2

  &::-ms-fill-upper
    background: rgba($track-color, 80%)
    border: $track-border-width solid $track-border-color
    border-radius: $track-radius*2

  &::-ms-thumb
    thumb()
// Progress Bar Styles END
</style>
