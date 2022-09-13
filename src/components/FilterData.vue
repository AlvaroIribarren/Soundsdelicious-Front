<template>
  <label class="filter-data" :class="{ selected: state }" v-if="filterData.length > 1">
    <input
    type="checkbox"
    :value="filterData"
    :checked="state"
    @change="change">
    <span>{{ filterData }}</span>
  </label>
</template>

<script>
export default {
  name: '',
  props: ['filterData', 'state'],
  methods: {
    change (e) {
      this.$emit('checkUpdate')
    }
  }
}
</script>

<style lang="stylus">
.filter-data
  display block
  padding .375rem 1.5rem
  box-sizing border-box
  cursor pointer
  transition all .2s ease
  color #2433D9
  margin 0
  position relative

  &.selected
    font-weight bold

  input
    position absolute !important
    height 1px
    width 1px
    overflow hidden
    clip rect(1px 1px 1px 1px)
    clip rect(1px, 1px, 1px, 1px)

@media (max-width 40em)
  .filter-data
    flex calc(50% - 10px)
    padding .375rem

    &:hover
      color #2433D9
      background white
</style>
