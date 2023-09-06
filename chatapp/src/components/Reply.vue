<script setup>
import { ref, onMounted, computed, inject, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import io from "socket.io-client";
import "../styles/reply.css"
import "../styles_mobile/reply.css"

const store = useStore();
const router = useRouter();
const route = useRoute();
const socket = io();

const userName = inject("userName")

const chatId = route.params.chatId;
const message = computed(() => store.state.message);
const user = computed(() => store.state.user);
const contentID = computed(() => store.state.chatID);

const replyContent = ref('');

// #region lifecycle
onMounted(() => {
  registerSocketEvent();
});
// #endregion

// #region browser event handler
const onPublishReply = () => {
  const json_reply = {
    type: "reply",
    parentChatId: chatId,
    chatname: user.value, // 返信先指名
    contentID: contentID.value, // 返信先ID
    username: userName.value,
    message: replyContent.value,
  };

  socket.emit("publishReplyEvent", JSON.stringify(json_reply));

  // Clear the input field
  replyContent.value = '';
};

// #endregion

// #region socket event handler
const registerSocketEvent = () => {
  const handlePublishReplyEvent = (data) => {
    const newReply = JSON.parse(data);
    if (newReply.parentChatId === chatId) {
      store.commit('addReply', newReply);
    }
  };

  socket.on("publishReplyEvent", handlePublishReplyEvent);

  onUnmounted(() => {
    socket.off("publishReplyEvent", handlePublishReplyEvent);
  });
};
// #endregion
</script>

<template>
  <div class="reply">
    <h1 class="text-h3 font-weight-medium">返信</h1>
    <div class="input-section mt-10">
      <p>Replying to: {{ message }}</p>
      <textarea v-model="replyContent" rows="4" class="area" placeholder="Type your reply here..."></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublishReply">返信</button>
      </div>
    </div>
    <div class="reply-section mt-10">
      <h3>返信</h3>
      <ul>
        <li v-for="(reply, i) in store.state.replyList.filter(r => r.parentChatId === chatId).slice().reverse()" :key="i">
          <div></div>
          <pre>{{reply.username + "さん " +"["+new Date(reply.unixtime).toLocaleString("jp-JP")+"]" }}</pre>
          <pre>{{ reply.message }}</pre>
        </li>
      </ul>
    </div>
    <router-link to="/chat" class="link">
      <button type="button" class="button-normal button-exit">戻る</button>
    </router-link>
  </div>
</template>
