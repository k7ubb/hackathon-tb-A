
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

  const data = {
    type: "enter_message",
    username: userName.value,
    message: userName.value + "さんが入室しました",
    unixtime: Date.now()
  };
  // 入室メッセージを送信
  // socket.emit("enterEvent", userName.value+"さんが入室しました。")
  // 全体で使用するnameに入力されたユーザー名を格納
  socket.emit("enterEvent", JSON.stringify(data));
  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <div class="user-name-container">
    <div class="mx-auto my-5 px-4">
      <h1 class="text-h3 font-weight-medium">コミュニケーションラボ</h1>
      <div class="mt-10">
        <p>ユーザー名</p>
        <input type="text" v-model="userName" class="user-name-text" />
      </div>
      <button type="button" @click="onEnter" class="button-normal">入室する</button>
    </div>
  </div>
</template>

<style scoped>
  .user-name-container {
    border-radius: 0px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh; /* 画面の高さいっぱいに要素を配置 */
    background-color: white;
  }

  .user-name-text {
    border-radius: 10px;
    width: 400px;
    border: 1px solid #090909;
    padding: 1em;
    background-color: white;
  }

  input {
    width: 100%; /* 幅を100%に変更 */
    padding: 1em;
    font: inherit;
  }

  button {
    border-radius: 10px;
    color: black;
    background-color: blue;
    padding: 1em;
    width: 400px;
    margin-top: 1em; /* ボタンの上側のマージンを追加 */
  }
</style>

