<template>
  <div class="sidebar-container" :class="{ 'is-active': !!selectedFilter }">
    <div class="sidebar" :class="{ 'is-viewing-playlist': isViewingPlaylist }">
      <router-link to="/" class="logo" v-if="isViewingPlaylist"
        ><img src="/static/Untitled-1.png" alt=""
      /></router-link>

      <Search
        ref="search"
        :term="term"
        @updateTerm="updateTerm"
        v-show="!isViewingPlaylist"
      />
      <div class="filter-container m-hide" v-show="!isViewingPlaylist">
        <div class="tabs">
          <div
            class="tab"
            :class="{ active: isSelectedFilter(filter) }"
            v-for="(name, filter) in namedFilters"
            @click="selectFilter(filter)"
            :key="filter"
          >
            {{ name }}
          </div>
        </div>

        <div
          class="filter-text"
          v-show="formattedSelections && !isViewingPlaylist"
        >
          <strong>Selected:</strong> {{ formattedSelections }} /
          <a href="#" @click.prevent="clearAll()">Clear</a>
        </div>

        <auth />
        <div class="tab" @click="$emit('openContact')">
          <i class="material-icons">chat_bubble</i> Get in Touch
        </div>
      </div>
    </div>
    <div
      class="filter-data-holder"
      v-show="!!selectedFilter && !isViewingPlaylist"
    >
      <!--
        Each filter requires one box of filterDatas
      -->
      <div
        v-for="(filter, idx) in filters"
        class="filter-data-container"
        :class="filter"
        :key="idx"
      >
        <!-- <template v-if="filter === 'energy' && filterSet['energy']">
          <FilterData
            filterData="low"
            :state="filterSet[filter]['low']"
            @checkUpdate="checkUpdate('low', filter)"
            v-show="selectedFilter == filter" />
          <FilterData
            filterData="medium"
            :state="filterSet[filter]['medium']"
            @checkUpdate="checkUpdate('medium', filter)"
            v-show="selectedFilter == filter" />
          <FilterData
            filterData="high"
            :state="filterSet[filter]['high']"
            @checkUpdate="checkUpdate('high', filter)"
            v-show="selectedFilter == filter" />
        </template> -->

        <!-- <template v-if="filter === 'instruments' && filterSet['instruments']">
          <FilterData
            v-for="(idx, filterData) in filterSet[filter]"
            v-if="filterInstruments.includes(filterData)"
            :filterData="filterData"
            :state="filterSet[filter][filterData]"
            @checkUpdate="checkUpdate(filterData, filter)"
            v-show="selectedFilter == filter"
            :key="filterData" />
        </template> -->

        <template>
          <FilterData
            v-for="filterData in sortFilterSet(filter)"
            :filterData="filterData"
            :state="filterSet[filter][filterData]"
            @checkUpdate="checkUpdate(filterData, filter)"
            v-show="selectedFilter == filter"
            :key="filterData"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import Search from "./Search";
import FilterData from "./FilterData";
import Auth from "@/components/Auth";

window.Vue = Vue;

export default {
  name: "Sidebar",
  props: [
    "filters",
    "filterSet",
    "filterSelections",
    "namedFilters",
    "term",
    "isViewingPlaylist"
  ],
  data() {
    return {
      selectedFilter: ""
    };
  },
  components: {
    Search,
    Auth,
    FilterData
  },
  computed: {
    formattedSelections() {
      return this.filters
        .map(filter => {
          return this.filterSelections[filter]
            .map(filterData => `${filterData} (${this.namedFilters[filter]})`)
            .join(", ");
        })
        .filter(data => !!data)
        .join(", ");
    }
  },
  methods: {
    checkUpdate(filterData, filter) {
      this.$emit("checkUpdate", filterData, filter);
    },
    selectFilter(filter) {
      if (this.selectedFilter === filter) {
        this.selectedFilter = "";
      } else {
        this.selectedFilter = filter;
      }
    },
    isSelectedFilter(filter) {
      return this.selectedFilter === filter;
    },
    clearAll() {
      this.$emit("clearAll");
    },
    updateTerm(term) {
      this.$emit("updateTerm", term);
    },
    clearSearch() {
      this.$refs.search.clearSearch();
    },
    sortFilterSet(filter) {
      if (
        this.filterSet[filter] &&
        ["genre", "primary_keywords"].includes(filter)
      ) {
        return Object.keys(this.filterSet[filter])
          .filter(k => !!k)
          .sort();
      }
      return this.filterSet[filter] ? Object.keys(this.filterSet[filter]) : [];
    }
  }
};
</script>

<style lang="stylus">
.sidebar-container
  width 15em
  display flex
  transition all .2s ease
  height 100%

  &.is-active
    width 30em

    .filter-data-holder
      opacity 1

  @media (max-width 60em)
    width auto
    height auto

    .sidebar
      width 100%
      border none

    .filter-container,
    .filter-data-holder
      display none

.sidebar
  width 15em
  padding 1em 1em 0
  border-right 2px solid #ccc7c0

  &.is-viewing-playlist
    border none

.logo
  width 6em
  max-width 100%
  margin 1em
  display block

  @media (max-width 60em)
    display none

  img
    display block
    max-width 100%

.filter-container
  padding 1em 0

.tabs
  align-items center
  position relative
  margin 0 0 .25em

.tab
  padding .675em 1em
  cursor pointer
  width auto
  font-weight 600
  color #2433D9
  border-radius 2em
  margin 0 0 .5em
  transition all .2s ease

  i
    font-size 16px !important

  &:hover
    background rgba(36, 51, 217, 0.3)

  &.active
    border-color #2433D9
    background #2433D9
    color white

.filter-data-holder
  opacity 0
  transition all .2s ease
  border-right 2px solid #ccc7c0
  padding 1em 1em 0
  width 15em
  overflow hidden
  overflow-y auto

.filter-data-container
  margin 0 auto
  width 15em

.filter-text
  font-size .875em
  text-align center
  line-height 1.5
  margin 0 0 1rem

.small-tabs
  padding .75em 1.5em
  width 100%
  box-sizing border-box
  border none
  outline none
  text-align center
  border-radius 2em
  background #2433D9
  color white
  appearance none
  text-transform uppercase

.tabs__arrow
  color white
  position absolute
  right 4.25em
  top .675em
  z-index 999

@media (max-width 40em)
  .tabs
    display block
    margin 0 0 .75em

    .m-show
      display flex

  .filter-data-holder
    height 26em

  .genre, .energy, .collec
    .filter-data
      flex 100% 0 0 !important
      padding .875rem .5rem !important

  .faq-icon
    margin-left .5em
    padding 0 .875em
    box-sizing border-box
    text-align center
    border-radius 2em
    background white

    span
      display block
      padding .7em 0
</style>
