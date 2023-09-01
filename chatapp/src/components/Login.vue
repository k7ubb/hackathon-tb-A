<<<<<<< Updated upstream
<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"
import "../styles/login.css"

// #region global state
const userName = inject("userName")
const chatContent = inject("chatContent")
const chat_type = inject("chat_type")

// #endregion

// #region local variable
const router = useRouter()
const socket = io()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  // ユーザー名が入力されているかチェック
  if(userName.value===""){
    alert("ユーザー名を入力してください。")
    return
  }

  // 入室メッセージを送信
  socket.emit("enterEvent", JSON.stringify({
    type: "enter_message",
    username: userName.value,
    message: userName.value + "さんが入室しました",
    unixtime: Date.now()
  }))

  // chatContentの初期値を「報告」に設定
  chatContent.value = "aaaaaaa";
  chat_type.value = "report_message";

  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat サンプル</h1>
    <div class="mt-10">
      <p>ユーザー名</p>
      <input type="text" v-model="userName" class="user-name-text" />
    </div>
    <button type="button" @click="onEnter" class="button-normal">入室する</button>
  </div>
</template>
=======
<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import io from "socket.io-client"

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const socket = io()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  // ユーザー名が入力されているかチェック
  if(userName.value===""){
    alert("ユーザー名を入力してください。")
    return
  }
  // 入室メッセージを送信
  socket.emit("enterEvent", userName.value+"さんが入室しました。")
  // 全体で使用するnameに入力されたユーザー名を格納
  
  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat サンプル</h1>
    <div class="mt-10">
      <p>ユーザー名(20字以内)</p>
      <input type="text" v-model="userName" class="user-name-text" @input="limitTextLength" />
      <p>残り{{ remaining }}です。</p>
    </div>
    <button type="button" @click="onEnter" class="button-normal">入室する</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userName: "", // ユーザー名の初期値
      remaining: 20, // 制限文字数の初期値
    };
  },
  methods: {
    limitTextLength() {
      // ユーザー名の文字数を制限
      if (this.userName.length > this.remaining) {
        this.userName = this.userName.slice(0, this.remaining);
      }

      // 残りの文字数を計算
      this.remaining = 20 - this.userName.length;
    },
  },
};
</script>

<style scoped>
.user-name-text {
  width: 200px;
  border: 1px solid #888;
  margin-bottom: 16px;
}
</style>
>>>>>>> Stashed changes
