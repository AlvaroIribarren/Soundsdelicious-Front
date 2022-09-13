<template>
  <div class="auth">
    <div class="tab" @click="toggleAuth" v-show="!$auth.check()"><i class="material-icons">account_box</i> Login or Register</div>
    <div class="tab" @click="logout" v-show="$auth.check()"><i class="material-icons">account_box</i> Logout</div>
    <div v-if="isAuthVisible">
      <div class="bg" @click="toggleAuth(false)"></div>
      <div class="authmodal">
        <div class="authmodal__container" v-if="type === 'login'">
          <h2>Login</h2>
          <p class="error">{{ error }}</p>
          <input name="email" type="email" placeholder="email" v-model="user.email">
          <input name="password" type="password" placeholder="password" v-model="user.password">
          <button class="lbtn" @click="authorize">Login</button>
          <p class="note">don't have an account? <span @click="changeType('register')" class="faux--a">sign up</span></p>
        </div>
        <div class="authmodal__container" v-else> <!-- register -->
          <h2>Sign Up</h2>
          <p class="error">{{ error }}</p>
          <input name="email" type="email" placeholder="email" v-model="user.email">
          <input name="password" type="password" placeholder="password" v-model="user.password">
          <input type="password" placeholder="repeat password" v-model="user.password2">
          <button class="lbtn" @click="authorize">Sign Up</button>
          <p class="note">already have an account? <span @click="changeType('login')" class="faux--a">login</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { $bus } from './EventBus.js'

export default {
  name: 'Search',
  props: ['term'],
  data () {
    return {
      isAuthVisible: false,
      type: 'login',
      user: {
        email: '',
        password: '',
        password2: ''
      },
      error: ''
    }
  },
  created () {
    $bus.$on('auth_open', (type) => {
      if (type === 'download') {
        this.error = 'An account is needed to download any tracks'
      }
      this.toggleAuth(true)
    })
  },
  methods: {
    // toggle auth modal visibility
    toggleAuth (to) {
      this.isAuthVisible = typeof to !== 'undefined' ? to : !this.isAuthVisible
    },

    // change the type of auth
    changeType (to) {
      this.error = ''
      this.type = to
    },

    // do the login or register process
    async authorize () {
      if (this.type === 'login') {
        try {
          await this.$auth.login({
            data: {
              email: this.user.email,
              password: this.user.password,
              type: this.type
            }
          })
          this.toggleAuth(false)
        } catch (e) {
          console.error(e)
          this.error = 'Oops, an error occured'
        }
      }
      if (this.type === 'register') {
        if (this.password !== this.password2) {
          this.error = 'Password do not match'
          return false
        }
        try {
          await this.$auth.register({
            data: {
              email: this.user.email,
              password: this.user.password,
              type: this.type
            },
            staySignedIn: true,
            autoLogin: true
          })
          this.toggleAuth(false)
        } catch (e) {
          console.error(e)
          this.error = 'Oops, an error occured'
        }
      }
    },

    logout () {
      this.$auth.logout()
    }
  }
}
</script>

<style lang="stylus" scoped>
.bg
  position fixed
  top 0
  right 0
  bottom 0
  left 0
  background rgba(black, .3)
  z-index 9998

.error
  font-style italic
  color tomato

.authmodal
  z-index 9999
  height 30em
  width 30em
  background #ffedd6
  top 50%
  left 50%
  margin (-@height/2) 0 0 (-@width/2)
  position fixed
  box-sizing border-box
  padding 1em 1.5em
  text-align center
  display flex
  align-items center

  &__container
    flex 1

  input, button
    display block
    margin 0 auto .5em
    width 100%
</style>
