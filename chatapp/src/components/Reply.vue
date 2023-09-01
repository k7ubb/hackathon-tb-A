<script setup>
import { io } from 'socket.io-client';
import { ref, reactive, computed, onMounted, inject} from 'vue';
import { useStore } from 'vuex';

const userName = inject("userName")
const store = useStore();
const message = computed(() => store.state.message);
const user = computed(() => store.state.user);

const replyContent = ref("");
const replyList = reactive([]);
const socket = io();

onMounted(() => {
  registerSocketEvent();
});

const onPublish = () => {
  if (replyContent.value.trim() === "") {
    alert("返信内容を入力してください。");
    return;
  }

  const reply = {
    type: "message",
    username: userName.value,
    message: replyContent.value,
    unixtime: new Date().toLocaleString()
  }
  store.commit('addReply', reply);
  socket.emit("publishReply", JSON.stringify(reply));
  replyContent.value = "";
};

const onReceivePublish = (data) => {
  store.state.replyList.push(JSON.parse(data));
};

const registerSocketEvent = () => {
  socket.on("newReply", (data) => {
    onReceivePublish(data);
  });
};
</script>


<template>
  <div>
    <h1>返信用ページ</h1>
    <h2 v-if="message !== null">{{ message }}</h2>
    <p v-if="user !== null">相談者: {{ user }}</p>
    <h2 v-else>ページ間のデータの受け渡しができませんでした</h2>

    <!-- 返信入力欄 -->
    <div>
      <textarea v-model="replyContent" placeholder="返信を入力..."></textarea>
      <button class="button-normal" @click="onPublish" >返信</button>
    </div>

    <!-- 返信リスト -->
    <ul>
      <li v-for="(reply, index) in store.state.replyList.slice().reverse()" :key="index">
        <div>
          <span>{{ reply.unixtime }}</span>
          <p>{{ reply.username }}さん: {{ reply.message }}</p>
        </div>
      </li>
    </ul>

    <router-link :to ="{name: 'chat'}">前のページ</router-link>
  </div>
</template>