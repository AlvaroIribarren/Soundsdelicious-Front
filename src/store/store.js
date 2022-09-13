import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    playbackInfo: {
      state: 'pause',
      current: null
    }
  },

  mutations: {
    SET_PLAYBACK_INFO (state, info) {
      state.playbackInfo = {
        ...state.playbackInfo,
        ...info
      }
    }
  },

  actions: {
    setPlaybackInfo ({ commit }, info) {
      commit('SET_PLAYBACK_INFO', info)
    },

    togglePlaybackInfoState ({ state, commit }) {
      commit('SET_PLAYBACK_INFO', {
        ...state.playbackInfo,
        state: state.playbackInfo.state === 'play' ? 'pause' : 'play'
      })
    }
  }
})
