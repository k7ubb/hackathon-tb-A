<script setup>
import { inject, ref, reactive, onMounted, onUnmounted, computed } from "vue"
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import io from "socket.io-client"
import "../styles/chat.css"
import "../styles_responsive/chat.css"

// #region global state
const userName = inject("userName")       // ユーザ名
// #endregion

// #region local variable
const router = useRouter()
const store = useStore()
const socket = io()
const publishInterval = 1                                       // 連続投稿時の最低待ち時間 [s]
const maxLength = () => chatType.value == "contact"? 100 : 300  // 文字数制限 (相談 : それ以外)
let lastPublishTime = 0
// #endregion

// #region reactive variable
const chatType = ref("report")
const chatContent = ref("")
const mentionedUser = ref(null)
const memoList = reactive([])
const show_order = ref(true)
const consult_timelimit = ref(null) // 相談の解答期限
const isReplyShow = ref(false)      // 返信・メモ表示切替
const mentionDropdown = ref(null);
const mentionQuery = ref("");
// #endregion

// 返信表示欄
const replyMessageName = ref('')
const replyMessageID = ref('')
const replyMessageContent = ref('')

const replyContent = ref('');

const showMentionDropdown = ref(false);

const filteredReplyList = reactive([]);

const filteringReplyList = () => {
  filteredReplyList.splice(0);
  store.state.replyList.forEach(currentValue => {
    if(currentValue.chatname===replyMessageName.value && currentValue.contentID===replyMessageID.value){
      filteredReplyList.push({
        username: currentValue.username,
        replycontent: currentValue.message
      })
    }
  });
}

const onComfirmReply = (contributor, chat_number, content) => {
  replyMessageName.value = contributor
  replyMessageID.value = chat_number
  replyMessageContent.value = content
  replyContent.value = "確認しました。"
  onPublishReply()
  isReplyShow.value = true
}
const onPublishReply = () => {
  const json_reply = {
    type: "reply",
    chatname: replyMessageName.value, // 返信先指名
    contentID: replyMessageID.value, // 返信先ID
    username: userName.value, // 自分の名前
    message: replyContent.value,
  };

  socket.emit("publishReplyEvent", JSON.stringify(json_reply));

  // Clear the input field
  replyContent.value = '';
};

// メンション機能
// ----------------------------------

// カーソル位置を取得する関数
const dropdownStyle = reactive({ left: '0px', top: '0px' });  // 追加

// カーソル位置に基づいてドロップダウンの位置を設定
const setDropdownPosition = (event) => {
  const cursorPosition = event.target.selectionStart;
  const textArea = event.target;
  const rect = textArea.getBoundingClientRect();
  const lineHeight = parseInt(window.getComputedStyle(textArea)["line-height"]);
  const lines = Math.floor(cursorPosition / textArea.cols);
  const left = (cursorPosition % textArea.cols) * 10;  // 仮の文字幅

  dropdownStyle.left = `${rect.left + left}px`;
  dropdownStyle.top = `${rect.top + (lines * lineHeight)}px`;
};

const filteredOnlineUsers = computed(() => {
  if (mentionQuery.value === "") return store.state.onlineUsers;
  return store.state.onlineUsers.filter(user =>
    user.toLowerCase().includes(mentionQuery.value.toLowerCase())
  );
});

const onInput = (event) => {
  const lastAt = chatContent.value.lastIndexOf("@");
  // if (chatContent.value.includes("@") && mentionedUser.value === null) {
  if (lastAt && mentionedUser.value === null) {
    mentionQuery.value = chatContent.value.slice(lastAt + 1);
    showMentionDropdown.value = true;
  } else if (!chatContent.value.includes("@") || (mentionedUser.value !== null && !chatContent.value.includes("@" + mentionedUser.value))) {
    showMentionDropdown.value = false;
    mentionedUser.value = null;  // メンションが消されたら、mentionedUserをリセット
  }
};

// プルダウンから選択したユーザー名をテキストエリアに挿入
const selectMention = (username) => {
  const currentContent = chatContent.value;
  const atIndex = currentContent.lastIndexOf("@");
  chatContent.value = `${currentContent.substring(0, atIndex)}@${username} `;
  showMentionDropdown.value = false;  // Hide the dropdown
  mentionedUser.value = username;
};


// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  event.preventDefault()
  showMentionDropdown.value = false;
  try{
    if (Date.now() - lastPublishTime < publishInterval * 1000) {
      throw new Error(publishInterval + '秒に一度しか送信はできません．お待ち下さい')
    }
    if (chatContent.value.trim() === "") {
      throw new Error('メッセージを入力してください。')
    }
    if (chatContent.value.length > maxLength()) {
      throw new Error('文字数上限を超えています。')
    }
  } catch(e) {
    alert(e.message)
    return
  }
  //投稿ボタンを押す前に、報連相の確認を表示する。
  let type
  if(chatType.value=="report"){
    type="報告"
  }
  if(chatType.value=="contact"){
    type="連絡"
  }
  if(chatType.value=="consult"){
    type="相談"
  }
  if(!confirm(type+"です。\nよろしいですか？"))  return

  const json_chat = {
    type: "message",
    message_type: chatType.value,
    username: userName.value,
    message: chatContent.value,
    ...(chatType.value === "consult" && {
      consult_timelimit: consult_timelimit.value
    }),
    targetUser: mentionedUser.value,             // 選択されたユーザー
  }

  socket.emit("publishEvent", JSON.stringify(json_chat))
  lastPublishTime = Date.now()

  chatType.value = "report"
  onMessageTypeChange()
}

// メモを画面上に表示する
const onMemo = () => {
  memoList.push({
    type: "memo",
    username: userName.value,
    message: chatContent.value,
  })

  // onMessageTypeChangeの中で、テキストボックスは初期化される(テンプレートが入力される)ので、無効化
  // chatContent.value = ''
  chatType.value = "report"
  onMessageTypeChange()
  chatContent.value = ''
}

// ほうれんそう選択時の処理
const onMessageTypeChange = () => {
  switch (chatType.value) {
    case "report":  // 報告
      chatContent.value = "進捗・結果: \n"
      break
    case "contact": // 連絡
      chatContent.value = "現状: \n"
      break
    case "consult": // 相談
      chatContent.value = "現状の問題点: \n考えられる原因: "
      break
  }
}
onMessageTypeChange()

// 返信欄の表示→投稿欄の特定の投稿が押されたとき
const showReply = (contributor, chat_number, content) => {
  replyMessageName.value = contributor
  replyMessageID.value = chat_number
  replyMessageContent.value = content
  isReplyShow.value = true
  filteringReplyList();
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", JSON.stringify({
    type: "leave_message",
    username: userName.value,
    message: userName.value + "さんが退室しました",
  }))
}
// #endregion

const onReply = (chat) => {
  store.commit('setMessage', chat.message)
  store.commit('setUser', chat.username)
  store.commit('setID', chat.chatID)
  router.push({ name: "reply", params:{chatId: chat.unixtime}})
}

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  const handleEnterEvent = (data) => {
    store.commit('addChat', JSON.parse(data))
    console.log(chatContent)
  }

  const handleExitEvent = (data) => {
    store.commit('addChat', JSON.parse(data))
  }

  const handlePublishEvent = (data) => {
    store.commit('addChat', JSON.parse(data))
  }

  const handleOnlineUsers = (data) => {
    store.commit('setOnlineUsers', JSON.parse(data))
  }

  const handleError = (data) => {
    alert(data)
  }

  const handlePublishReplyEvent = (data) => {
    const newReply = JSON.parse(data);
    store.commit('addReply', newReply);
   filteringReplyList();
  };

  socket.on("enterEvent", handleEnterEvent)
  socket.on("exitEvent", handleExitEvent)
  socket.on("publishEvent", handlePublishEvent)
  socket.on("error", handleError)
  socket.on("onlineUsers", handleOnlineUsers)
  socket.on("publishReplyEvent", handlePublishReplyEvent);

  onUnmounted(() => {
    socket.off("enterEvent", handleEnterEvent)
    socket.off("exitEvent", handleExitEvent)
    socket.off("publishEvent", handlePublishEvent)
    socket.off("onlineUsers", handleOnlineUsers)
    socket.off("publishReplyEvent", handlePublishReplyEvent);
  })
}

addEventListener("close", () => {
  onExit()
})
// #endregion
</script>

<template>
  <div class="chat">
    <h1>コミュニケーションラボ</h1>
    <div class="info">
      <p class="login-user">ログインユーザ：{{ userName }}さん</p>
    </div>

    <div class="post">
      <div class="post-info">
        <form @change="onMessageTypeChange">
          <label><input type="radio" v-model="chatType" value="report">報告 </label>
          <label><input type="radio" v-model="chatType" value="contact">連絡 </label>
          <label><input type="radio" v-model="chatType" value="consult">相談 </label>
        </form>
        <div class="length-count" :class="{ 'red': (chatContent.length > maxLength())}">文字数：{{chatContent.length + "/" + maxLength()}}</div>
        <div class="consult-timelimit" v-if="chatType == 'consult'">回答期限:<input type="datetime-local" step="300" v-model="consult_timelimit"></div>
      </div>
      <div class="online-users">
        <p>メンションするオンラインユーザー
          <select v-model="mentionedUser" class="select">
            <option disabled value="">選択してください</option>
            <option v-for="user in store.state.onlineUsers" :key="user" :value="user">{{ user }}</option>
          </select>
        </p>
      </div>
      <!-- メンション用のプルダウン -->
      <div ref="mentionDropdown" v-if="showMentionDropdown" class="mention-dropdown" :style="dropdownStyle">
        <ul>
          <li v-for="user in filteredOnlineUsers" :key="user" @click="selectMention(user)">
            {{ user }}
          </li>
        </ul>
      </div>
      <textarea @input="onInput($event); setDropdownPosition($event)" @keydown.enter.exact="onPublish" placeholder="投稿文を入力してください " v-model="chatContent"></textarea>
      <div class="submit">
        <button @click="onPublish">投稿</button>
        <button @click="onMemo">メモ</button>
      </div>
    </div>
    <label><input type="checkbox" v-model="show_order"> 新しいメッセージを上に表示</label>
    <div class="chat-container">
      <div class="chat-area">
        <ul>
          <li v-for="(chat, i) in show_order? store.state.chatList.slice().reverse() : store.state.chatList.slice()" :key="i">
            <div :class="chat.type" v-if="chat.type=='message'">
              <div class="optionIcon" :class="chat.message_type"></div>
              <div class="message" :class="{ 'mine': (chat.type === 'message' && chat.username === userName), 'others':  (chat.type === 'message' && chat.username !== userName), 'mentioned': (chat.type === 'message' && chat.targetUser === userName)}">
                <pre>{{`${chat.username}さん [${new Date(chat.unixtime).toLocaleString("jp-JP")}]` }}</pre>
                <pre class="messageContent" @click="showReply(chat.username, chat.chatID, chat.message)">{{ chat.message }}</pre>
                <span v-if="chat.targetUser !== userName && chat.targetUser !== null"> ({{ chat.targetUser }}へメンションされています)</span>
                <span v-else-if="chat.targetUser === userName">（このメッセージはあなたへメンションされています）</span>
                <div class="button-container">
                  <pre><button @click="onComfirmReply(chat.username, chat.chatID, chat.message)">確認</button></pre>
                  <pre><button @click="onReply(chat)">返信</button><span class="consult-option notes" v-if="chat.consult_timelimit!=null">{{ "※回答期限："+chat.consult_timelimit }}</span></pre>
                </div>
              </div>
            </div>
            <pre :class="chat.type" v-if="chat.type=='enter_message'">{{ chat.message }}</pre>
            <pre :class="chat.type" v-if="chat.type=='leave_message'">{{ chat.message }}</pre>
          </li>
        </ul>
      </div>

      <div class="memo" v-if="!isReplyShow">
        <h3>メモ一覧</h3>
        <div>
          <ul>
            <li v-for="(memo, i) in memoList.slice().reverse()" :key="i">
              <pre>{{ memo.message }}</pre>
            </li>
          </ul>
        </div>
      </div>

      <div class="memo reply" v-if="isReplyShow">
        <button @click="isReplyShow=false">メモ一覧を表示</button>
        <div>
          <textarea v-model="replyContent" rows="4" class="area" placeholder="Type your reply here..."></textarea>
          <div class="mt-5">
            <button class="button-normal" @click="onPublishReply">返信</button>
          </div>
        </div>
        <div>
          <pre>{{replyMessageName}}</pre>
          <pre class="messageContent">{{replyMessageContent}}</pre>
          <ul>
            <li v-for="(reply, i) in filteredReplyList.slice().reverse()" :key="i">
              <div class="user-name">{{reply.username}}</div>
              <div>{{reply.replycontent}}</div>
            </li>
          </ul>
          </div>
        </div>
      </div>
    </div>

    <router-link to="/">
      <button type="button" @click="onExit">退室する</button>
    </router-link>
</template>