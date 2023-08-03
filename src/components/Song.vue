<template>
  <div class="song">
    <div class="player">
      <div v-show="videoSyncActive">
        <input
          type="checkbox"
          class="video-sync-checkbox"
          @change="onCheckboxChange"
        />
      </div>
      <div class="play-pause">
        <div class="icon" ref="playButton" @click="triggerPlayPause()">
          <div v-show="!meta.isPlaying" class="i-play">
            <i class="material-icons">play_arrow</i>
          </div>
          <div v-show="meta.isPlaying" class="i-pause">
            <i class="material-icons">pause</i>
          </div>
        </div>
      </div>
      <div class="header">
        <h1 class="title">{{ song.title.trim() }}</h1>
        <h2 class="artist">{{ song.artist.trim() }}</h2>
      </div>
      <div class="meta">
        <div>
          <strong>{{ song.genre[0] }}</strong>
        </div>
        <div>{{ song.primary_keywords.slice(0, 3).join(", ") }}</div>
      </div>
      <div :class="'wave-' + song._id" class="wave"></div>
      <!--<div class="duration" v-if="meta.duration != 0">{{ meta.duration }}</div>-->
      <div class="interact">
        <template v-if="!isViewingPlaylist">
          <a
            @click="playlistAdd"
            title="Add To Playlist"
            class="playlist--control btn btn-link"
            v-if="!isInPlaylist"
            ><i class="material-icons">add</i></a
          >
          <a
            @click="playlistRemove"
            title="Remove From Playlist"
            class="playlist--control btn btn-link"
            v-else
            ><i class="material-icons">remove</i></a
          >
        </template>
        <b-dropdown variant="none" no-caret>
          <template v-slot:button-content>
            <i class="material-icons">get_app</i>
          </template>
          <div class="b-dropdown-item">
            <a
              download
              target="_blank"
              @click.prevent="dl('mp3')"
              title="Download This Audio File"
              >Download MP3</a
            >
          </div>
          <div class="b-dropdown-item">
            <a
              download
              target="_blank"
              @click.prevent="dl('wav')"
              title="Download This Audio File"
              >Download WAV</a
            >
          </div>
          <div class="b-dropdown-item" v-show="song.has_stems">
            <a
              download
              target="_blank"
              @click.prevent="dl('zip')"
              title="Download All Stems (.zip)"
              class="m-hide"
              >Download Stems</a
            >
          </div>
        </b-dropdown>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import { $bus } from "./EventBus.js";
import { BDropdown } from "bootstrap-vue";
import wavesurfer from "wavesurfer.js";
import { config } from "../config";

export default {
  name: "Song",
  props: {
    song: {
      type: Object,
      required: true
    },
    playlist: {
      type: Array,
      required: true
    },
    isViewingPlaylist: {
      type: Boolean,
      default: false
    },
    vol: {
      type: Number,
      default: 1
    },
    songsLoaded: {
      type: Array,
      required: true
    },
    videoSyncActive: {
      type: Boolean,
      required: true
    }
  },
  components: {
    "b-dropdown": BDropdown
  },
  data() {
    return {
      wave: "",
      meta: {
        playedOnce: false,
        isPlaying: false,
        isDownloadDropVisible: false,
        songsDir: `https://${config.API_URL}/songs`,
        currentDownload: {
          wav: "",
          mp3: ""
        },
        duration: "00:00",
        usesWav: false,
        toLoad: ""
      }
    };
  },
  watch: {
    playbackInfo(currentPlaybackInfo) {
      if (currentPlaybackInfo.state === "play") {
        if (currentPlaybackInfo.current === this.song.num_id) {
          this.play();
        } else {
          this.pause();
        }
      }
      if (currentPlaybackInfo.state === "pause") {
        this.pause();
      }
    },

    vol() {
      this.wave && this.wave.setVolume(this.vol);
    }
  },
  mounted() {
    this.wave = this.createTrack();
    this.loadTrack();
    this.$refs.playButton.addEventListener("mouseover", this.loadTrackInMemory);
  },
  unmounted() {
    this.$refs.playButton.removeEventListener(
      "mouseover",
      this.loadTrackInMemory
    );
  },
  computed: {
    ...mapState(["playbackInfo"]),

    shortId() {
      return this.song.num_id;
    },

    /**
     * All keywords associated with a song, comma separated
     */
    allKeywords() {
      const keys = [
        "primary_keywords",
        "secondary_keywords",
        "searchable_keywords"
      ];
      const keywords = [];
      keys.map(k => keywords.push(...this.song[k]));
      return keywords.join(", ");
    },

    /**
     * Check if current song is in playlist
     */
    isInPlaylist() {
      return this.playlist.includes(this.shortId);
    },

    songIsLoaded() {
      return this.songsLoaded
        .map(song => song.num_id)
        .includes(this.song.num_id);
    }
  },
  methods: {
    ...mapActions(["setPlaybackInfo"]),

    createTrack() {
      return wavesurfer.create({
        container: ".wave-" + this.song._id,
        backend: "MediaElement",
        waveColor: "#dbe6e8",
        progressColor: "#2433D9",
        cursorColor: "#2433D9",
        backgroundColor: "transparent",
        barWidth: 2,
        height: 26,
        cursorWidth: 2,
        fillParent: true
      });
    },

    getPeaks() {
      this.axios
        .get(`/songs-peaks/${this.song.title}/${this.song.title}.json`)
        .then(peaks => {
          const empty =
            "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV";
          this.wave.load(empty, peaks.data.data);
          this.wave.drawBuffer();
        })
        .catch(err => {
          console.log(`Error in ${this.song.title} ${err}`);
        });
    },
    loadTrack() {
      const path = this.link(".mp3");
      const pathWav = path.replace("mp3", "wav");
      // set track length
      this.meta.duration = this.secondsToDuration(this.song.length);
      // set download path
      this.meta.currentDownload.wav = `${pathWav}?dl=1`;
      this.meta.currentDownload.mp3 = `${path}?dl=1`;
      // Pause the song if it's playing before switching
      if (this.meta.isPlaying) this.pause();
      // Position is reset
      this.meta.playedOnce = false;
      this.toLoad = this.meta.usesWav ? pathWav : path;
      // Load appropriate track (default: mp3) with peaks
      this.getPeaks();
      this.wave.on("ready", () => {
        const s = Math.floor(this.wave.getDuration());
        this.meta.duration = this.secondsToDuration(s);
        this.wave.setVolume(this.vol);
      });
      this.wave.on("error", () => {
        if (!this.meta.usesWav) {
          console.log(`Broken MP3: ${path}`);
          this.meta.usesWav = true;
          this.loadTrack();
        }
      });
    },

    triggerPlayPause() {
      if (this.meta.isPlaying) {
        this.setPlaybackInfo({ state: "pause", current: this.song.num_id });
      } else {
        this.setPlaybackInfo({ state: "play", current: this.song.num_id });
      }
      // this.meta.isPlaying = !this.meta.isPlaying;
      // this.emitPlaySong();

      if (this.isPlaying) this.pause();
      else this.play();
    },

    play() {
      this.wave.play();
      this.meta.isPlaying = true;
    },

    pause() {
      this.meta.isPlaying = false;
      if (this.wave.isPlaying()) {
        this.wave.pause();
      }
    },

    dl(ext) {
      if (this.$auth.check()) {
        const link = this.meta.currentDownload[ext] || this.link("." + ext);
        this.axios.post("/auth/dl/trc", { title: this.song.title });
        window.open(link, "_blank");
      } else {
        $bus.$emit("auth_open", "download");
      }
    },

    link(suffix) {
      return `${this.meta.songsDir}/${this.song.title}/${this.song.title}${suffix}`;
    },

    playlistAdd() {
      this.$emit("playlistAdd", this.shortId);
    },

    playlistRemove() {
      this.$emit("playlistRemove", this.shortId);
    },

    clearSearch() {
      this.$refs["search"].clearSearch();
    },

    secondsToDuration(s) {
      return s > 0
        ? Math.floor(s / 60)
            .toString()
            .padStart(2, "0") +
            ":" +
            (s % 60).toString().padStart(2, "0")
        : 0;
    },

    loadTrackInMemory() {
      if (this.wave.isDestroyed) {
        this.wave = this.createTrack();
        this.loadTrack();
      }

      if (!this.meta.isPlaying && !this.songIsLoaded) {
        this.wave.load(this.toLoad);
        this.$emit("songsLoadedAdd", {
          wave: this.wave,
          num_id: this.song.num_id
        });
      }
    },

    emitPlaySong() {
      this.$emit("selectedSongForPlaying", this.song, this.wave);
    },

    onCheckboxChange(checked) {
      if (checked.target.checked) {
        this.$emit("addSongToSync", this.song);
      } else {
        this.$emit("removeSongFromSync", this.song);
      }
    }
  }
};
</script>

<style lang="stylus" scoped>
.song
  position relative
  padding .75em 0 .5em
  border-bottom 2px solid #ccc7c0

.video-sync-checkbox
  transform translate(0, -5px)

.title,
.artist
  font-weight 400
  margin 0 1rem 0 0
  width 20em
  line-height 1.5
  font-size 1em

.title
  font-weight 700

.meta
  margin 0
  width 15em

.chooser
  .icon-menu
    transform scale(1.25)
    display inline-block
    position relative
    top 2px

.track-buttons__main
  display flex
  width 100%
  margin-left -.25em
  position absolute
  bottom 0

  button
    flex 1
    margin-left .5em

.player
  display flex
  width 100%
  position relative
  padding 0
  align-items center
  justify-content space-between

.play-pause
  position relative
  z-index 9
  display flex
  width 3em
  padding-right 4em

  .icon
    font-size 2em
    line-height 1
    border-radius 2em
    padding .45em 0
    height 2em
    box-sizing border-box
    position relative
    z-index 10
    cursor pointer
    transition all .2s ease
    color #2433D9

    i
      display inline-block
      transform translateX(1px)

    &:hover
      border-color darken(#2433D9, 20%)
      color #000

  .i-pause
    color #2433D9

    i
      transform none

.btn,
>>> .btn
  color #2433D9
  font-size 1.5em

.wave
  display block
  width 15em

.playlist--control
  position relative

.duration
  padding-right 1em

.button
  display block
  text-decoration none
  color #2433D9
  text-transform uppercase
  width 100%
  padding .5em 1em
  background #eee
  font-weight bold
  margin 0 0 .5em
  box-sizing border-box

  &:hover
    background #2433D9
    color white

@media (max-width 60em)
  .meta,
  .wave
    display none
  .interact >>> .btn
    padding 0 !important

@media (max-width 50em)
  .title,
  .artist
    width 40vw

@media (max-width 35em)
  .song
    font-size .875em
</style>
