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
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>コミュニケーションラボ</v-card-title>
          <v-card-subtitle class="mb-4">ログインユーザ：{{ userName }}さん</v-card-subtitle>

          <v-divider></v-divider>

          <!-- 返信するメッセージの内容を表示 -->
          <v-card-text class="mb-4">
            <p class="reply-message" v-html="message"></p>
            <!-- <v-subheader>返信するメッセージ:</v-subheader>
            <p>{{ message }}</p> -->
          </v-card-text>

          <v-card-text>
            <v-textarea
              v-model="replyContent"
              label="上記のメッセージに対しての返信文を入力"
              rows="4"
            ></v-textarea>
          </v-card-text>

          <v-card-actions>
            <v-btn @click="onPublishReply" color="primary">返信</v-btn>
          </v-card-actions>

          <v-divider></v-divider>

          <v-list two-line>
            <v-list-item-group v-for="(reply, i) in store.state.replyList.slice().reverse()" :key="i">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>{{reply.username + "さん " +"["+new Date(reply.unixtime).toLocaleString("jp-JP")+"]" }}</v-list-item-title>
                  <v-list-item-subtitle>{{ reply.message }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>

          <v-card-actions>
            <router-link to="/chat">
              <v-btn color="secondary">戻る</v-btn>
            </router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
