<!-- <div class="sink">
  <span class="sink__count">Results: {{ selectedSongs.length }} </span>
  <b-dropdown
    v-if="canZipDownload"
    text="Download All"
    variant="primary"
    class="sink__download"
    size="small"
  >
    <b-dropdown-item @click.prevent="downloadAllSelected('mp3')"><a href="#">Download All MP3's</a></b-dropdown-item>
    <b-dropdown-item @click.prevent="downloadAllSelected('wav')"><a href="#">Download All WAV's</a></b-dropdown-item>
  </b-dropdown>
</div> -->

<template>
  <div id="app" :class="appClass">
    <!-- <span @click="meta.isFaqOpen = true" title="FAQ"><i class="icon-faq"></i></span> -->
    <div :class="headerClass">
      <video
        autoplay
        muted
        loop
        playsinline
        poster="/static/soundsdelicious-header.jpg"
      >
        <source
          src="/static/soundsdelicious-header-animated.mp4"
          type="video/mp4"
        />
      </video>
      <!--
        <div class="header__logo">
          <img src="/static/soundsdelicious-newlogo.png" alt="" />
        </div>
      -->
      <div class="header__scroll" @click="scrollToApp"></div>
    </div>

    <div class="page-container" v-on:wheel="onPastHeaderScroll">
      <Sidebar
        ref="sidebar"
        :filters="filters"
        :filter-set="filterSet"
        :filter-selections="filterSelections"
        :named-filters="namedFilters"
        :term="term"
        :is-viewing-playlist="isViewingPlaylist"
        @checkUpdate="updateCheck"
        @clearAll="clearAll"
        @openFaq="meta.isFaqOpen = true"
        @updateTerm="fetchSongs"
        @openContact="meta.isContactOpen = true"
      />

      <div class="main-content">
        <div class="header-container">
          <video-sync />
          <Playlist
            :playlist="playlist"
            ref="Playlist"
            :is-viewing-playlist="isViewingPlaylist"
          />
        </div>
        <div class="songs" v-show="meta.areSongsVisible">
          <div class="wrap">
            <h1 class="songs__title">Songs</h1>
            <div class="songs-container">
              <Song
                v-for="song in paginatedSelectedSongs"
                :key="song._id"
                :song="song"
                :playlist="playlist"
                :is-viewing-playlist="isViewingPlaylist"
                :vol="audioVolume"
                :songsLoaded="songsLoaded"
                :actualPlayingSong="actualPlayingSong"
                @playlistAdd="playlistAdd"
                @playlistRemove="playlistRemove"
                @songsLoadedAdd="songsLoadedAdd"
                @selectedSongForPlaying="selectedSongForPlaying"
              />
              <button
                @click="updateSongsNum"
                class="lbtn lbtn--ghost load-more"
                v-if="selectedSongs.length > songsNum"
              >
                View More
              </button>
              <div v-if="selectedSongs.length === 0">
                <h3>No matching results found</h3>
              </div>
            </div>
            <div class="downloader" v-show="isViewingPlaylist">
              <span @click.prevent="downloadAllSelected('mp3')"
                >Download<br />All<br /><i class="material-icons"
                  >file_download</i
                ></span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal-bg"
      v-show="meta.isContactOpen || meta.isFaqOpen"
      @click="
        meta.isContactOpen = false;
        meta.isFaqOpen = false;
      "
    ></div>
    <div class="modal modal--large modal--faq" v-show="meta.isFaqOpen">
      <div v-html="content.faq" />
      <div class="modal--close" @click="meta.isFaqOpen = false">✖</div>
    </div>
    <div class="modal modal--contact" v-show="meta.isContactOpen">
      <h1>Contact</h1>
      <div v-if="meta.isContactSubmitted" class="note">
        Successfully sent, thank you!
      </div>
      <form @submit.prevent="submitContact" v-if="!meta.isContactSubmitted">
        <input type="email" v-model="contact.email" placeholder="Email" />
        <input type="text" v-model="contact.subject" placeholder="Subject" />
        <textarea v-model="contact.body" placeholder="Message"></textarea>
        <button class="lbtn">Send Message</button>
      </form>
      <div class="modal--close" @click="meta.isContactOpen = false">✖</div>
    </div>

    <KeyInput />

    <Loading :active.sync="meta.isLoadingZip" />
    <!--<div class="music-player" v-if="this.actualPlayingSong">
      <music-player
        :song="this.actualPlayingSong"
        :wavePlaying="this.actualPlayingWave"
        :vol="audioVolume"
      />
    </div>-->
  </div>
</template>

<script>
import dl from "downloadjs";
import { BDropdown } from "bootstrap-vue";

import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/vue-loading.min.css";

import { $bus } from "@/components/EventBus.js";
import Search from "@/components/Search";
import Playlist from "@/components/Playlist";
import Song from "@/components/Song";
import Sidebar from "@/components/Sidebar";
import VideoSync from "@/components/VideoSync";
import KeyInput from "@/components/KeyInput";
import MusicPlayer from "../components/MusicPlayer.vue";

export default {
  name: "home",
  components: {
    Search,
    Playlist,
    Song,
    Sidebar,
    VideoSync,
    KeyInput,
    Loading, // third party
    "b-dropdown": BDropdown,
    MusicPlayer
  },
  data() {
    return {
      showHeader: true,
      loading: true,
      filters: ["genre", "primary_keywords", "instruments"],
      songs: [],
      songsLoaded: [],
      maxSongsInMemory: 10,
      selectedSongs: [], // songs that have been selected by filtering
      filterSet: {}, // filter tree with their data in "true" or "false"
      term: "", // search term
      songsNum: 20,
      playlist: [],
      isViewingPlaylist: false,
      actualPlayingWave: "",
      actualPlayingSong: null,
      audioVolume: 1,
      content: {
        faq: ""
      },
      meta: {
        isLoadingZip: false,
        isFaqOpen: false,
        isContactOpen: false,
        isContactSubmitted: false,
        areSongsVisible: true,
        songsLeft: true
      },
      contact: {
        email: "",
        subject: "",
        body: ""
      },
      termEquivalences: []
    };
  },
  computed: {
    appClass() {
      return {
        "app--is-viewing-playlist": this.isViewingPlaylist
      };
    },
    headerClass() {
      return {
        "main-header": true,
        hidden: !this.showHeader
      };
    },
    namedFilters() {
      const names = ["Genre", "Keywords", "Instruments"];
      const named = {};

      this.filters.forEach((filter, i) => {
        named[filter] = names[i];
      });

      return named;
    },
    filterSelections() {
      // Display filters with their selected info like
      // Selected: XYZ (Mood), ABC (Energy); Excluded: foo (Mood)

      const selected = {};

      // Initialize both
      this.filters.forEach(filter => {
        selected[filter] = [];
      });

      this.filters.forEach(filter => {
        const currentFilters = this.filterSet[filter];
        if (!currentFilters) return false; // wtf?

        Object.keys(currentFilters)
          .filter(filterData => currentFilters[filterData] === true) // Select only true values
          .forEach(filterData => selected[filter].push(filterData)); // Push in format
      });

      return selected;
    },
    paginatedSelectedSongs() {
      this.meta.songsLeft = this.songsNum < this.selectedSongs.length;
      return this.selectedSongs.slice(0, this.songsNum);
    },
    canZipDownload() {
      return this.songs.length > this.selectedSongs.length || this.term;
    },
    isMobile() {
      var isMobile = false;
      // device detection
      /* eslint-disable */
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
          navigator.userAgent
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          navigator.userAgent.substr(0, 4)
        )
      ) {
        isMobile = true;
      }
      /* eslint-enable */
      return isMobile;
    }
  },
  methods: {
    /**
     * Convert string or array to array
     */
    toArray(item) {
      return typeof item === "string" ? [item] : item;
    },

    /**
     * Initialize intersecting filter data for required elements
     */
    initializeFilters() {
      // make request for term equivalences
      this.axios.get("/terms").then(res => {
        this.termEquivalences = res.data.termEquivalences;
      });
      // compute filter data from song
      this.songs.forEach(song =>
        this.filters.forEach(filter => {
          this.$set(this.filterSet, filter, this.filterSet[filter] || {});
          (this.toArray(song[filter]) || []).forEach(filterData => {
            if (!this.filterSet[filter].hasOwnProperty(filterData)) {
              this.$set(this.filterSet[filter], filterData, false);
            }
          });
        })
      );
    },

    /**
     * Fetch songs matching search term
     */
    fetchSongs(term = "") {
      this.loading = true;
      this.term = term;
      this.meta.songsLeft = true;

      return this.axios
        .post("/search", { term })
        .then(res => {
          this.loading = false;
          this.songs = [...res.data];
          this.initializeFilters();
          this.selectedSongs = [...res.data]; // initialize selectedSongs
          if (this.isViewingPlaylist) {
            this.selectedSongs = this.selectedSongs.filter(song =>
              this.playlist.includes(song.num_id)
            );
          }
          if (term) {
            this.selectSongs();
          }
        })
        .catch(err => {
          console.log(err);
        });
    },

    /**
     * Fetches metadata for about and FAQ
     */
    fetchMeta() {
      this.axios.post("/meta").then(res => {
        this.content.faq = res.data.faq;
      });
    },

    /**
     * Updates an individual filter's "checked" value and calls to select filtered songs
     */
    updateCheck(filterData, filter) {
      const currentState = this.filterSet[filter][filterData];
      if (filter === "collec") {
        // If part of a collection, deselect all others!
        const collecFilters = Object.keys(this.filterSet["collec"]);
        collecFilters.forEach(f => {
          this.$set(this.filterSet["collec"], f, false);
        });
      }
      this.$set(this.filterSet[filter], filterData, !currentState);
      this.hideSongs();
      this.selectSongs();
    },

    /**
     * Reset to default number of visible songs on screen
     */
    hideSongs() {
      if (window.matchMedia("(max-width: 40em)").matches) {
        this.hideSongsBehindButton();
      }
      this.songsNum = 20;
      return true;
    },

    /**
     * Update the number of songs shown on screen
     */
    updateSongsNum() {
      this.songsNum += 20;
      return true;
    },

    /**
     * Get all term equivalences for a filter term, including the term itself
     */
    filtersGetTermEquivalences(term) {
      return (
        this.termEquivalences.find(termsRow => termsRow.includes(term)) || [
          term
        ]
      );
    },

    /**
     * Checks if data of the song matches the filters that the user selected
     * filters are added via set intersection (logical AND)
     */
    filtersMatch(song) {
      // check if inner condition is true for every 'filter'
      // 'filter' here can be 'genre', 'primary_keywords', etc.
      return this.filters.every(filter => {
        const filterSet = this.filterSelections[filter];
        if (filter === "genre" || filter === "energy") {
          // just check by OR
          return filterSet.length
            ? filterSet.some(filterData => song[filter].includes(filterData))
            : true;
        }
        if (filter === "primary_keywords") {
          // check every inner filterData with AND,
          // also allow equivalences here
          return filterSet.every(filterData => {
            const filterDataAndEquivalences = this.filtersGetTermEquivalences(
              filterData
            );
            return filterDataAndEquivalences.some(filterData =>
              song[filter].includes(filterData)
            );
          });
        } else {
          // check every inner filterData with AND
          return filterSet.every(filterData =>
            song[filter].includes(filterData)
          );
        }
      });
    },

    /**
     * Narrow down selected songs to those who fit filters
     */
    selectSongs() {
      this.selectedSongs = this.songs.filter(this.filtersMatch);
    },

    /**
     * Submit a contact form to server
     */
    submitContact() {
      this.axios.post("/contact", this.contact).then(_ => {
        this.meta.isContactSubmitted = true;
      });
    },

    // Clear all selected filters, search, etc
    clearAll() {
      this.filters.forEach(filter => {
        const currentFilters = this.filterSet[filter];
        Object.keys(currentFilters).forEach(filterData => {
          this.$set(this.filterSet[filter], filterData, false);
        });
      });
      // clear search
      this.$refs.sidebar.clearSearch();
      // clear playlist
      this.playlist = [];
      this.isViewingPlaylist = false;
      // re-fetch and select songs
      this.fetchSongs().then(_ => this.selectSongs());
    },

    /**
     * Create & download zip file for all selected songs
     */
    downloadAllSelected(format) {
      // Create compressed data for songs
      const songs = this.selectedSongs.map(s => ({ title: s.title }));
      // Start loader
      this.meta.isLoadingZip = true;
      this.axios
        .post("/dl", { format, songs }, { responseType: "blob" })
        .then(songsDl => {
          this.meta.isLoadingZip = false;
          dl(new Blob([songsDl.data]), "search_results.zip");
        });
    },

    /**
     * Load playlist if user has navigated from one
     */
    loadPlaylist() {
      const playlist = this.$refs.Playlist.load();
      this.playlist = playlist;
      if (playlist.length) {
        this.isViewingPlaylist = true;
      }
    },

    /**
     * Add/remove a given song to playlist
     */
    playlistAdd(shortId) {
      if (!this.playlist.includes(shortId)) {
        this.playlist.push(shortId);
      }
    },
    playlistRemove(shortId) {
      this.playlist.splice(this.playlist.indexOf(shortId), 1);
    },

    /**
     * Smooth scroll
     */
    scrollTo(element, duration) {
      var start = window.pageYOffset;
      var end = element.offsetTop;
      var distance = end - start;
      var startTime = new Date().getTime();

      function easeInOutQuad(time, start, distance, duration) {
        time /= duration / 2;
        if (time < 1) return (distance / 2) * time * time + start;
        time--;
        return (-distance / 2) * (time * (time - 2) - 1) + start;
      }

      function animation() {
        var time = new Date().getTime() - startTime;
        var newPosition = easeInOutQuad(time, start, distance, duration);
        window.scrollTo(0, newPosition);
        if (time < duration) requestAnimationFrame(animation);
      }

      requestAnimationFrame(animation);
    },

    scrollToApp() {
      const target = document.querySelector(".page-container");
      this.scrollTo(target, 1000);
      this.showHeader = false;
    },

    /**
     * Set show header in false if user scrolls down past header
     */
    onPastHeaderScroll() {
      this.showHeader = false;
    },

    monitorVolume() {
      $bus.$on("setAudioVolume", vol => {
        this.audioVolume = vol / 100;
      });
    },

    songsLoadedAdd(wave) {
      this.songsLoaded.push(wave);
      if (this.songsLoaded.length > this.maxSongsInMemory) {
        this.songsLoaded.splice(0, 1)[0].wave.destroy();
      }
    },

    selectedSongForPlaying(song, wave) {
      this.actualPlayingSong = song;
      this.actualPlayingWave = wave;
    }
  },

  created() {
    this.fetchMeta();
    this.fetchSongs();
    this.monitorVolume();
  },

  mounted() {
    this.loadPlaylist();
  }
};
</script>

<style lang="stylus">
@import 'bootstrap/dist/css/bootstrap.css'
@import 'bootstrap-vue/dist/bootstrap-vue.css'

$secondary = #F2903C
$tertiary = #F782AA
/**
 * @license
 * MyFonts Webfont Build ID 3974591, 2020-11-11T17:25:05-0500
 *
 * The fonts listed in this notice are subject to the End User License
 * Agreement(s) entered into by the website owner. All other parties are
 * explicitly restricted from using the Licensed Webfonts(s).
 *
 * You may obtain a valid license at the URLs below.
 *
 * Webfont: NeuzeitGro-Lig by URW Type Foundry
 * URL: https://www.myfonts.com/fonts/urw/neuzeit-grotesk/t-light/
 *
 * Webfont: NeuzeitGro-Bla by URW Type Foundry
 * URL: https://www.myfonts.com/fonts/urw/neuzeit-grotesk/t-black/
 *
 * Webfont: NeuzeitGroCon-Bla by URW Type Foundry
 * URL: https://www.myfonts.com/fonts/urw/neuzeit-grotesk/t-black-condensed/
 *
 * Webfont: NeuzeitGro-Reg by URW Type Foundry
 * URL: https://www.myfonts.com/fonts/urw/neuzeit-grotesk/t-regular/
 *
 * Webfont: NeuzeitGro-Bol by URW Type Foundry
 * URL: https://www.myfonts.com/fonts/urw/neuzeit-grotesk/t-bold/
 *
 * Webfont: NeuzeitGroExt-Bla by URW Type Foundry
 * URL: https://www.myfonts.com/fonts/urw/neuzeit-grotesk/t-black-extra-condensed/
 *
 *
 * Webfonts copyright: (URW)++,Copyright 2014 by (URW)++ Design &amp;amp; Development
 *
 * © 2020 MyFonts Inc
*/


/* @import must be at top of file, otherwise CSS will not work */
@import url("//hello.myfonts.net/count/3ca5bf");

@font-face {
  font-family: 'NeuzeitGro';
  font-weight bold
  src: url('/static/webFonts/NeuzeitGro-Bol/font.woff2') format('woff2'), url('/static/webFonts/NeuzeitGro-Bol/font.woff') format('woff');
}
@font-face {
  font-family: 'NeuzeitGroCon-Bla';
  src: url('/static/webFonts/NeuzeitGroCon-Bla/font.woff2') format('woff2'), url('/static/webFonts/NeuzeitGroCon-Bla/font.woff') format('woff');
}
@font-face {
  font-family: 'NeuzeitGro';
  font-weight 300
  src: url('/static/webFonts/NeuzeitGro-Lig/font.woff2') format('woff2'), url('/static/webFonts/NeuzeitGro-Lig/font.woff') format('woff');
}
@font-face {
  font-family: 'NeuzeitGro';
  font-weight 900
  src: url('/static/webFonts/NeuzeitGro-Bla/font.woff2') format('woff2'), url('/static/webFonts/NeuzeitGro-Bla/font.woff') format('woff');
}
@font-face {
  font-family: 'NeuzeitGro';
  src: url('/static/webFonts/NeuzeitGro-Reg/font.woff2') format('woff2'), url('/static/webFonts/NeuzeitGro-Reg/font.woff') format('woff');
}
@font-face {
  font-family: 'NeuzeitGroExt-Bla';
  src: url('/static/webFonts/NeuzeitGroExt-Bla/font.woff2') format('woff2'), url('/static/webFonts/NeuzeitGroExt-Bla/font.woff') format('woff');
}
@font-face {
  font-family: 'RaisonnePro';
  font-weight 300
  src: url('/static/webFonts/RaisonnePro/RaisonnePro-Light.ttf') format('truetype');
}
@font-face {
  font-family: 'RaisonnePro';
  font-weight 400
  src: url('/static/webFonts/RaisonnePro/RaisonnePro-Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'RaisonnePro';
  font-style italic
  font-weight 400
  src: url('/static/webFonts/RaisonnePro/RaisonnePro-Oblique.ttf') format('truetype');
}
@font-face {
  font-family: 'RaisonnePro';
  font-weight 700
  src: url('/static/webFonts/RaisonnePro/RaisonnePro-Bold.ttf') format('truetype');
}
@font-face {
  font-family: 'RaisonnePro';
  font-weight 900
  src: url('/static/webFonts/RaisonnePro/RaisonnePro-Bold.ttf') format('truetype');
}

*
  scrollbar-width: thin

::-webkit-scrollbar
	width: 5px

::-webkit-scrollbar-track-piece
	background-color: rgba(white, .4)

::-webkit-scrollbar-thumb
  background-color: #CBCBCB
  border-radius: 10px

::-webkit-scrollbar-thumb:hover
	background-color: #909090


// Main
body
  margin 0
  padding 0
  background #ffffff

#app, button, input, textarea, select
  font-family RaisonnePro, 'Open Sans', 'Helvetica', Arial, sans-serif
  font-size 100%
  line-height 1.5

.faux--a
  color #2433d9
  cursor pointer
  &:hover
    color lighten(@color, 20%)

i
  transform translate(-.24em, .24em)

input, textarea
  padding 1em
  outline none !important
  border 0px solid #dde0e1
  border-radius 2px
  font-size 100%
  line-height 1.5
  box-sizing border-box

  &:focus
    border-color #2433D9

.page-container
  display flex
  flex-direction row
  height 100vh
  overflow hidden

  .main-content
    flex 1
    height 100%
    display flex
    flex-direction column

popout-style(color)
  border 4px solid color
  box-shadow 8px 8px 0 color
  color color

.button--popout
  display flex
  align-items center
  justify-content center
  color #36936d
  background #fff
  popout-style @color
  font-weight 900
  font-size 1.375em
  padding 1.75em 3.5em
  line-height 1.1
  margin 0.27em 0 0.25em 0
  outline none

  &:hover, &:focus
    color darken(@color, 15%)
    outline none

  span
    margin-top -.8em
    display inline-block

  i
    margin 0 2rem 0 0
    transform translate(-.1em, .3em)
    font-size 1.5em !important

.interact-cards
  display flex
  justify-content center

.interact-card
  font-size 1.375em
  padding 1.75em 3.5em
  background white
  display flex
  box-sizing border-box
  align-items center
  popout-style $secondary
  margin 1em
  position relative
  &__title
    font-weight bold
  > span
    transition .3s ease
  // video
  &--video
    padding 0
    max-width 40%
    position relative
    &:after
      content ' '
      position absolute
      top 0
      left 0
      right 0
      bottom 0
      z-index 99
    video
      width 100%
      display block
      margin 0
      max-height 40vh
  // notice
  &__notice
    position absolute
    left 0
    right 0
    bottom -2.75rem
    cursor pointer
    color #2433d9 !important
    font-weight bold
    font-size 1rem
  // hoverable
  &--hoverable
    flex-direction column
    &:hover
      & ^[0]__hover-content
        opacity 1
        margin-top 0
      & ^[0]__title
        margin -1.5rem 0 .5rem
  &__hover-content
    font-size .875rem
    color #999
    max-width 18em
    opacity 0
    margin -1rem -3em -2em
    text-align left

.interact-card--tertiary
  popout-style $tertiary

.main-header
  position relative
  transition-duration .5s
  transition-timing-function ease-in
  transition-property all

  .header__logo
    position absolute
    top 1em
    left 1em
    width 6em
    img
      display block
      max-width 100%

  .header__scroll
    position absolute
    bottom .75em
    left 50%
    right 50%
    height 2em
    width 1.825em
    margin-left -(@width/2)
    font-size 2em
    color white
    text-align center
    cursor pointer
    transition all .3s ease

    &:hover
      bottom .5em

    &:before, &:after
      content ''
      position absolute
      width 1em
      height 2px
      background rgba(white, .7)
      transform rotate(-30deg)
      bottom 1em
      right 0
    &:before
      transform rotate(30deg)
      bottom 1em
      left 0

    @media (max-width 40em)
      display none

  video
    width 100%

  @media (min-width 60em)
    height 100vh
    overflow hidden

    video
      width 100%
      display block
      object-fit cover
      margin 0
      position absolute
      top 0
      bottom 0
      left 0
      right 0
      height 100%

.lbtn
  border-radius 3em !important
  padding .25em 1em
  background #2433D9
  color white
  font-size 100%
  line-height 1.5
  border none
  border-radius 2px
  cursor pointer
  transition all .15s ease
  border 3px solid @background

  &:hover,
  &:focus,
  &:active
    background darken(#2433D9, 30%)
    outline none

  &--ghost
    background transparent
    color #2433D9
    font-weight 700

    &:hover,
    &:focus,
    &:active
      color white
      background #2433D9

a
  text-decoration none
  transition all .2s ease
  color #2433D9

  &:hover
    color darken(@color, 40%)

.wrap
  width 90%
  max-width 70em
  margin 0 auto

.load-more
  margin 2em auto 20em
  display inline-block
  min-width auto
  width auto
  display block
  outline none !important

// Collections

.collections
  background #ffffff
  border-bottom thin solid #fafafa

  & > .wrap
    display flex
    flex-wrap wrap
    justify-content center

  &-container
    width 55em
    display flex
    flex-wrap wrap
    justify-content center
    margin-left -.5em

// Downloader
.downloader
  font-size 1.375em
  padding 1.75em 3.5em
  align-items center
  text-align center

  span
    font-weight bold
    margin 0 auto
    display flex
    flex-direction column
    align-items center
    justify-content center
    background white
    border-radius 100%
    display flex
    height 8em
    box-sizing border-box
    width @height
    transition all .3s ease
    cursor pointer
    popout-style $secondary

    &:hover
      popout-style darken($secondary, 15%)

  i
    position relative
    left .27em

// Small Header
.small-header
  background #353535
  color white
  text-align center

  h1
    margin 0
    font-weight 300
    font-size 1.5em
    padding .5em 0
    display inline-block

  a
    background #eee
    border-radius 2em
    color #353535
    padding .25em .6em 0
    line-height 0
    margin-left .5em
    position relative
    top -1px

    i
      line-height 0

.contact--m
  text-align center
  font-size 1.25em
  text-align center
  padding 3em 1em
  font-weight bold
  background #FFD6A5
  color #2433D9

// MODAL
.modal-bg
  position fixed
  top 0
  left 0
  right 0
  bottom 0
  z-index 999
  background rgba(black, .5)

.modal
  position fixed
  display block
  max-height 80%
  max-height 80vh
  overflow-y auto
  max-width 40em
  top 50%
  left 50%
  transform translate(-50%, -50%)
  z-index 1000
  background white
  padding .5em 1.5em
  background #ffedd6
  border-radius 2px
  box-shadow 0 2px 5px rgba(black, .5)

  .note
    text-align center
    font-size 1.125em

  h1
    font-size 1.5em
    margin .5rem 0 1rem

  input, textarea
    width 100%
    margin 0 0 1em
    display block

  textarea
    min-height 15em
    resize none

  button
    margin 0 auto 1em

  &--close
    position absolute
    top 1.5em
    right 1.5em
    line-height 1
    cursor pointer

// Wave
wave
  overflow hidden !important

// Filter Grid
.grid
  display flex
  margin-left -1em

.grid__item
  margin-left 1em

.quarter
  flex 3 0 0

.three-quarters
  flex 9 0 0

.keywords
  display flex
  flex-wrap wrap
  border-left thin solid #eee
  border-top thin solid #eee
  margin 0 0 1em

// Songs
.button--view-results
  display block
  margin 1em auto
  width 90%
  font-size 1em
  background #353535

.songs
  padding 1.5em 0
  height 100%
  flex 1
  flex-basis 0
  min-height 0

  > .wrap
    height 100%
    display flex
    flex-direction column

  &__title
    font-weight bold
    color #2433d9

.header-container
  display flex
  width 90%
  max-width 80em
  margin 0 auto

.songs-container
  flex 1
  flex-basis 0
  min-height 0
  overflow-y auto

//
// Mobile
//
.m-show
  display none

@media (max-width 60em)
  .page-container
    flex-direction column

  .video-sync
    display none

@media (max-width 40em)
  .modal
    width 90%
    height 90vh
    max-height 90vh
    box-sizing border-box

  .m-show
    display block
  .m-hide
    display none !important


//
// Widescreen
//
@media (min-width 110em)
  html
    font-size 112.5%

@media (min-width 150em)
  html
    font-size 125%


//
// Misc
//
.hidden
  height 0


// Playlist Specific
.app--is-viewing-playlist
  .main-header
    display none

.btn-primary
  background #2433D9
  border-color @background

  &:hover, &:focus, &:active
    background darken(@background, 10%)
    border-color @background

.b-dropdown-item
  display block
  padding 0 .5rem
  font-size .875em
  cursor pointer

  + .b-dropdown-item
    padding-top .25rem
    margin-top .25rem
    border-top thin solid #eee

  a
    text-decoration none
    display block
</style>
