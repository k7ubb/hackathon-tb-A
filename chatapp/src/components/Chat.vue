<script setup>
import { inject, ref, reactive, onMounted } from "vue"
import io from "socket.io-client"

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = io()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])

const memoList = reactive([]) // メモのリスト

const lastPublishTime = ref(0)
const show_order = ref(true)

// constants
const publishInterval = 5 // とりあえずめっちゃ短く

// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  const currentTime = Date.now()
  // 任意時間で連投できないようにする
  if(currentTime-lastPublishTime.value < publishInterval){
    alert('5秒に一度しか送信はできません．お待ち下さい')
    return
  }
  let data = {
    type: "message",
    username: userName.value,
    message: chatContent.value,
    //Date()で現在の時刻をミリ秒単位で所得➡ミリ秒単位を1000で割って秒に変換➡Math.floorで小数点以下切り下げ➡整数値➡UNIX時間所得
    unixtime: Math.floor(Date.now() ),
  }

  socket.emit("publishEvent", JSON.stringify(data))
  // 入力欄を初期化
  chatContent.value = ""

  // lastUserName = userName.value
  lastPublishTime.value = currentTime
}


// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", userName.value+"さんが退室しました。")
}

// メモを画面上に表示する
const onMemo = () => {
  // メモの内容を表示
  memoList.push(userName.value + "さんのメモ:" + chatContent.value)
  // 入力欄を初期化
  chatContent.value = ""
}
// #endregion

// Enterで改行, Shift+Enterで送信
const onKeyDown = (event) => {
  if (event.keyCode === 13) {
    if (event.shiftKey) {
    } else {
      event.preventDefault()  // デフォルトの改行挿入を防ぐ
      onPublish()
    }
  }
}

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
//  chatList.push(data)
  chatList.push({type:"enter_message", message:data})
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
//  chatList.push(data)
  chatList.push({type:"leave_message", message:data})
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  let chatdata = JSON.parse(data)
  chatList.push(chatdata)
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (data) => {
    onReceiveEnter(data)
  })

  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (data) => {
    onReceiveExit(data)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (data) => {
    onReceivePublish(data)
  })

  // エラーの実行
  // 現状， 連続投稿の場合の処理に使用
  socket.on("error", (data) => {
    alert(data) // エラーメッセージをアラートとして表示
  })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="'input-section mt-10'">
      <p class="login-user">ログインユーザ：{{ userName }}さん</p>
      <!-- Enter キーが押されたときに投稿可能 -->
      <textarea @keydown.enter="onPublish" variant="outlined" placeholder="投稿文を入力してください " v-model="chatContent" rows="4" class="area"></textarea>
      <!-- 提案の手法 onKeyDownを使用 -->
      <!-- <textarea @keydown="onKeyDown" variant="outlined" placeholder="投稿文を入力してください " v-model="chatContent" rows="4" class="area"></textarea> -->
      <div class="mt-5">
          <button class="button-normal" @click="onPublish">投稿</button>
          <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
          <label><input type="checkbox" v-model="show_order"> 新しいメッセージを上に表示</label>
      </div>
    </div>
    <div class="chat-memo-container mt-10">
      <div class="chat-section">
        <div class="mt-5" v-if="chatList.length !== 0">
          <ul>
            <li class="item mt-4" v-for="(chat, i) in show_order? chatList.slice().reverse() : chatList.slice()" :key="i" :class="{ 'my-message': (chat.type === 'message' && chat.username === userName) }">
              <pre v-if="chat.type=='message'">{{ chat.username + "さん: " + chat.message +" ["+new Date(chat.unixtime).toLocaleString("jp-JP")+"]"}}</pre>
              <pre v-else>{{ chat.message }}</pre>
            </li>
          </ul>
        </div>
      </div>
      <div class="memo-section">
        <h3>メモ一覧</h3>
        <ul>
          <li v-for="(memo, i) in memoList.slice().reverse()" :key="i">
            <pre>{{ memo }}</pre>
          </li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>

<style scoped>
.login-user {
  margin-top: 20px;
}
.chat-memo-container {
  display: flex;
  justify-content: space-between;
}
.chat-section {
  width: 70%;
  overflow: auto;
}

.memo-section {
  width: 30%;
  overflow: auto;
  margin-left: 10px;
}
.link {
  text-decoration: none;
}

.area {
  width: 500px;
  border: 1px solid #000;
  margin-top: 8px;
}

.item {
  display: block;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}

.my-message {
  font-weight: bold;
  color: #333333;
  background-color: #f0f0f0;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

/* 表示順切り替えのチェックボックスが隣とくっつくので、仮の処理 */
label{
  margin-left: 8px;
}

/* ホバー時の効果も見やすいものに調整 */
.my-message:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}
</style>
