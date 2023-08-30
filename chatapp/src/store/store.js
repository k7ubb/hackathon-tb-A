import { createStore } from 'vuex';

export default createStore({
  state: {
    message: null,
    user: null
  },
  mutations: {
    setMessage(state, message) {
      state.message = message;
    },
    setUser(state, user){
      state.user = user;
    }
  }
});