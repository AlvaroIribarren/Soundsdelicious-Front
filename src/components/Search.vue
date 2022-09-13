<template>
  <div class="search">
    <form @submit="updateTerm" class="main-form">
      <i class="material-icons">search</i>
      <input type="text" placeholder="Search Keywords" v-model="newTerm" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
    </form>
    <button class="lbtn lbtn--ghost" @click="clearSearch" v-show="this.newTerm.length > 0">Clear <i class="material-icons">close</i></button>
  </div>
</template>

<script>
export default {
  name: 'Search',
  props: ['term'],
  data () {
    return {
      newTerm: this.term
    }
  },
  methods: {
    updateTerm (e) {
      e && e.preventDefault()
      this.$emit('updateTerm', this.newTerm.toLowerCase())
      return false
    },
    clearSearch () {
      this.newTerm = ''
      this.updateTerm()
    }
  }
}
</script>

<style lang="stylus" scoped>
.main-form
  display flex
  margin 0 auto
  width 100%
  position relative

  i
    position absolute
    left 1em
    top .375em
    z-index 9
    color #2433D9

  input
    flex 1 0 0
    border none
    font-size .875em
    padding-left 3em
    border-radius 2em
    background #FED6A5

    &::placeholder
      color #2433D9
.lbtn
  border-width 2px
  margin .5em 0 0 1em
  font-size .75em
  padding 0 .5em

  i
    font-size 1em
    margin-left 1.25em
</style>
