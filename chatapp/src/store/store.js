import { createStore } from 'vuex';

export default createStore({
  state: {
    message: null,
    user: null,
    chatList: [],
    memoList: [],
    replyList: []
  },
  getters: {
    getChatList: state => state.chatList,
    getMemoList: state => state.memoList,
  },
  mutations: {
    setMessage(state, message) {
      state.message = message;
    },
    setUser(state, user){
      state.user = user;
    },
    addChat(state, chat){
      state.chat = chat;
    },
    addReply(state, reply){
      state.reply = reply
    }
  },
  actions: {
    addChat({ commit, state }, chat) {
      const newChatList = [...state.chatList, chat];
      commit('addChat', newChatList);
    },
    addMemo({ commit, state }, memo) {
      const newMemoList = [...state.memoList, memo];
      commit('addMemo', newMemoList);
    },
    addReply({commit, state}, reply) {
      const newReplyList = [...state.replyList,memo];
      commit('addReply', newReplyList)
    }
  },
});
