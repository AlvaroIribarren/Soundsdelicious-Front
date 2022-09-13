import VueRouter from 'vue-router'
// Pages
import Home from '@/pages/Home'
// Routes
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      auth: undefined
    }
  }
]
const router = new VueRouter({
  history: true,
  mode: 'history',
  routes
})
export default router
