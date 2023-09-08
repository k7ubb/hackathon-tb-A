<script setup>
import { ref, onMounted, computed, inject, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import io from "socket.io-client";
import "../styles/reply.css"
import "../styles_responsive/reply.css"

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
    store.commit('addReply', newReply);
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
    <h1>コミュニケーションラボ</h1>
    <p class="reply-top">返信専用画面</p>
    <div class="input-section mt-10">
      <!-- <p class="reply-message">{{ message }}</p> -->
      <p class="reply-message" v-html="message"></p>
      <textarea v-model="replyContent" rows="4" class="area" placeholder="上記のメッセージに対しての返信文を入力"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublishReply">返信</button>
      </div>
    </div>
    <div class="reply-section mt-10">
      <h3>返信</h3>
      <ul>
        <li v-for="(reply, i) in store.state.replyList.slice().reverse()" :key="i">
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
