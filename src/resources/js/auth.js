// import bearer from '@websanova/vue-auth/drivers/auth/bearer'
import axios from '@websanova/vue-auth/drivers/http/axios.1.x'
import router from '@websanova/vue-auth/drivers/router/vue-router.2.x'

// Auth base configuration some of this options
// can be override in method calls

const config = {
  auth: {
    request: function (req, token) {
      this.http.setHeaders.call(this, req, {
        Authorization: 'Bearer ' + token
      })
    },

    response: function (res) {
      const token = res.data
      if (token && token.access_token) {
        return token.access_token
      }
    }
  },
  http: axios,
  router: router,
  registerData: { url: 'auth/register', method: 'POST', autologin: true, redirect: '', staySignedIn: true },
  loginData: { url: 'auth/login', method: 'POST', fetchUser: true, redirect: '', staySignedIn: true },
  logoutData: { url: 'auth/logout', method: 'POST', makeRequest: false, redirect: '' },
  fetchData: { url: 'auth/user', method: 'GET', enabled: true },
  refreshData: { url: 'auth/refresh', method: 'GET', enabled: false, interval: 30 }
}
export default config
