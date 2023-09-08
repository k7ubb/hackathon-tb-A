import { createStore } from 'vuex';

export default createStore({
  state: {
    message: null,
    user: null,
    chatID: null,
    chatList: [],
    memoList: [],
    replyList: [],  // Initialize as an empty array
    onlineUsers: []
  },
  getters: {
    getChatList: state => state.chatList,
    getMemoList: state => state.memoList,
    getReplyList: state => state.replyList,  // Add a getter for replyList
    getonlineUsers: state => state.onlineUsers
  },
  mutations: {
    setMessage(state, message) {
      state.message = message;
    },
    setUser(state, user){
      state.user = user;
    },
    setOnlineUsers(state, users) {
      state.onlineUsers = users;
    },
    setID(state, chatID){
      state.chatID = chatID;
    },
    addChat(state, chat) {
    if (!state.chatList.some(existingChat => existingChat.unixtime === chat.unixtime)) {
      state.chatList.push(chat);
    }
  },
   addReply(state, reply) {
    if (!state.replyList.some(existingReply => existingReply.unixtime === reply.unixtime)) {
      state.replyList.push(reply);
      console.log("Current replyList in store:", state.replyList);
    }
  },
  },
  actions: {
    addChat({ commit }, chat) {
      commit('addChat', chat);  // Fix this line to directly commit the chat
    },
    addMemo({ commit, state }, memo) {
      const newMemoList = [...state.memoList, memo];
      commit('addMemo', newMemoList);
    },
    addReply({ commit }, reply) {
      commit('addReply', reply);  // Fix this line to directly commit the reply
    },
  },
});