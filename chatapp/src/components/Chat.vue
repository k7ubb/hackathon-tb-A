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
const publishInterval = 5000 // 5分

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
  socket.emit("publishEvent", userName.value + "さん: " + chatContent.value)
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
  // chatList.push(userName.value + "さんのメモ:" + chatContent.value)
  // メモの内容を表示
  memoList.push(userName.value + "さんのメモ:" + chatContent.value)
  // 入力欄を初期化
  chatContent.value = ""
}
// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.push(data)
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.push(data)
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  chatList.push(data)
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

<!-- <template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>
      <textarea variant="outlined" placeholder="投稿文を入力してください " v-model="chatContent" rows="4" class="area"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>

      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i" :class="chat.startsWith( userName ) ? 'my-message' : ''">{{ chat }}</li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template> -->
<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="'input-section mt-10'">
      <p class="login-user">ログインユーザ：{{ userName }}さん</p>
      <textarea variant="outlined" placeholder="投稿文を入力してください " v-model="chatContent" rows="4" class="area"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
      </div>
    </div>
    <div class="chat-memo-container mt-10">
      <div class="chat-section">
        <div class="mt-5" v-if="chatList.length !== 0">
          <ul>
            <li class="item mt-4" v-for="(chat, i) in chatList" :key="i" :class="chat.startsWith( userName ) ? 'my-message' : ''">{{ chat }}</li>
          </ul>
        </div>
      </div>
      <div class="memo-section">
        <h3>メモ一覧</h3>
        <ul>
          <li v-for="(memo, i) in memoList" :key="i">{{ memo }}</li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>
//////
<script>
export default {
  // ... 他のコンポーネントオプション ...

  computed: {
    reversedChatList() {
      // chatListを逆順にした新しい配列を返す
      return this.chatList.slice().reverse();
    },
  },

  methods: {
    onPublish() {
      // 新しいメッセージをchatListの最初に追加
      this.chatList.unshift(this.chatContent);
      // chatContentをクリア
      this.chatContent = "";
    },
    // ...
  },
};
</script>
////////
<style scoped>
.login-user {
  margin-top: 20px; /* この値を調整して、希望の間隔に設定します */
}
.chat-memo-container {
  display: flex;
  justify-content: space-between; /* 両コンテンツの間にスペースを追加 */
}
.chat-section {
  width: 70%; /* チャット画面の幅を設定 */
  overflow: auto; /* 必要に応じてスクロールを有効にする */
}

.memo-section {
  width: 30%; /* メモ画面の幅を設定 */
  overflow: auto; /* 必要に応じてスクロールを有効にする */
  margin-left: 10px; /* チャット欄とメモ欄の間にマージンを追加 */
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

/* ホバー時の効果も見やすいものに調整 */
.my-message:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}
</style>