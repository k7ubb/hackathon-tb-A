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
const messageTypeText = {report: "報告", contact: "連絡", consult: "相談"}
const publishInterval = 1   // 連続投稿時の最低待ち時間 [s]
const templeteMessage = {
  report: `まず、誰に対しての「報告」かを選択してください。

そして、中間報告か最終報告かを入力してください。（報告の段階）

例
△△についての中間報告
投稿文～～～～～～～～～～～～～～～～
`,

  contact: `連絡は、簡潔に行うことが大切です。100文字以内で記入しましょう。

例
〇〇課長へ
昨日、課長宛てにメールが届いていましたので、確認をよろしくお願いいたします。`,

  consult: `回答期限を設定しましょう。

例
〇〇課長 9/14までに回答をよろしくお願いします。

昨日の会議で、AとBの二つの案が出ましたが、どちらを優先して取り組む方が良いでしょうか？`
}
let lastPublishTime = 0
let mentionTo = null
// #endregion

// #region local function
const maxLength = () => chatType.value == "contact"? 100 : 300  // 文字数制限 (相談 : それ以外)
const lengthCountStr = () => `文字数：${chatContent.value.length} / ${maxLength()}`
const messageTitle = (chat) => {
  return chat.reportTo?
    `${chat.username}さん → ${chat.reportTo}さん [${new Date(chat.unixtime).toLocaleString("jp-JP")}]` :
    `${chat.username}さん [${new Date(chat.unixtime).toLocaleString("jp-JP")}]`
}
const convertMessage = (message, mentionTo) => {
  return message
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>")
          .replace(/"([^"]+)"/g, '<strong>$1</strong>')
          .replace(new RegExp(`@${mentionTo}`, "g"), `<span class="mention">@${mentionTo}</span>`)
}
// #endregion

// #region reactive variable
const chatType = ref("report")
const chatContent = ref("")
const reportTo = ref(null)
const memoList = reactive([])
const show_order = ref(true)
const consult_timelimit = ref(null) // 相談の解答期限
const isReplyShow = ref(false)      // 返信・メモ表示切替
const mentionDropdown = ref(null);
const mentionQuery = ref("");
const isSubDisplay = ref(false) // サブディスプレイの表示・非表示切替
const isMainDisplay = ref(true) // メインディスプレイの表示・非表示切替
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
  socket.emit("publishReplyEvent", JSON.stringify({
    type: "reply",
    chatname: replyMessageName.value, // 返信先指名
    contentID: replyMessageID.value, // 返信先ID
    username: userName.value, // 自分の名前
    message: convertMessage(replyContent.value),
  }))
  replyContent.value = ''
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
  if (lastAt) {
    mentionQuery.value = chatContent.value.slice(lastAt + 1);
    showMentionDropdown.value = true;
  } else if (!chatContent.value.includes("@") || (mentionTo !== null && !chatContent.value.includes("@" + mentionTo))) {
    showMentionDropdown.value = false;
    mentionTo = null;  // メンションが消されたら、mentionToをリセット
  }
};

// プルダウンから選択したユーザー名をテキストエリアに挿入
const selectMention = (username) => {
  const currentContent = chatContent.value;
  const atIndex = currentContent.lastIndexOf("@");
  chatContent.value = `${currentContent.substring(0, atIndex)}@${username} `;
  showMentionDropdown.value = false;  // Hide the dropdown
  mentionTo = username;
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
    if (chatType.value == "report" && !reportTo.value) {
      throw new Error('報告先のユーザーを指定してください。')
    }
  } catch(e) {
    alert(e.message)
    return
  }

  //投稿ボタンを押す前に、報連相の確認を表示する。
  if (!confirm(messageTypeText[chatType.value] + "です。\nよろしいですか？")) {
    return
  }
  socket.emit("publishEvent", JSON.stringify({
    type: "message",
    message_type: chatType.value,
    username: userName.value,
    message: convertMessage(chatContent.value, mentionTo),
    ...(chatType.value === "consult" && {
      consult_timelimit: consult_timelimit.value
    }),
    ...(chatType.value === "report"  && {
      reportTo: reportTo.value,
    }),
    ...(mentionTo && {
      mentionTo: mentionTo,
    }),
  }))
  lastPublishTime = Date.now()

  chatType.value = "report"
  onMessageTypeChange()
}

// メモを画面上に表示する
const onMemo = () => {
  memoList.push({
    type: "memo",
    username: userName.value,
    message: convertMessage(chatContent.value),
  })
  chatType.value = "report"
  onMessageTypeChange()
  isSubDisplay.value = true;
  isReplyShow.value = false;
}

// ほうれんそう選択時の処理
const onMessageTypeChange = () => {
  chatContent.value = templeteMessage[chatType.value];
}
onMessageTypeChange()

// 返信欄の表示→投稿欄の特定の投稿が押されたとき
const showReply = (contributor, chat_number, content) => {
  replyMessageName.value = contributor
  replyMessageID.value = chat_number
  replyMessageContent.value = content
  isReplyShow.value = true
  isSubDisplay.value = true
  filteringReplyList()
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", JSON.stringify({
    type: "leave_message",
    username: userName.value,
    message: "退出："+userName.value + "さん",
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

  const handlePublishReplyEvent = (data) => {
    const newReply = JSON.parse(data);
    store.commit('addReply', newReply);
    filteringReplyList();
    console.log("Received reply in chat.vue:", newReply);
  };

  socket.on("enterEvent", handleEnterEvent)
  socket.on("exitEvent", handleExitEvent)
  socket.on("publishEvent", handlePublishEvent)
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

addEventListener("beforeunload", () => {
  onExit()
})
// #endregion
</script>

<template>
  <div class="chat">
    <h1>Communication Lab</h1>
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
        <div class="length-count" :class="{ 'red': (chatContent.length > maxLength())}">{{lengthCountStr()}}</div>
      </div>
      <div class="consult-timelimit" v-if="chatType == 'consult'">相談への回答期限: <input type="datetime-local" step="300" v-model="consult_timelimit"></div>
      <div class="reportTo" v-if="chatType == 'report'">
        <p>報告先のユーザー:
          <select v-model="reportTo" class="select">
            <option disabled value="">選択してください</option>
            <option v-for="user in store.state.onlineUsers" :key="user" :value="user">{{ user }}</option>
          </select>
        </p>
      </div>
      <!-- メンション用のプルダウン -->
      <div ref="mentionDropdown" v-if="showMentionDropdown" class="mention-dropdown" :style="dropdownStyle">
        <ul>
          <li v-for="user in filteredOnlineUsers" :key="user" @click="selectMention(user)">{{ user }}</li>
        </ul>
      </div>
      <textarea @input="onInput($event); setDropdownPosition($event)" @keydown.enter.shift="onPublish" placeholder="投稿文を入力してください " v-model="chatContent"></textarea>
      <div class="submit">
        <button @click="onPublish">投稿</button>
        <button @click="onMemo">メモ</button>
      </div>
    </div>

    <div class="chat-container">
      <div v-if="isMainDisplay" class="chat-area" :class="{'main-only':(!isSubDisplay)}">
        <div class="flex">
          <label><input type="checkbox" v-model="show_order"> 新しいメッセージを上に表示</label>
          <button class="sizeChange" :class="{ 'small': isSubDisplay }" @click="isSubDisplay = !isSubDisplay"></button>
          <button v-if="isSubDisplay" @click="isMainDisplay=false"><img src="../images/close.png" alt="x"></button>
        </div>
        <ul>
          <li v-for="(chat, i) in show_order? store.state.chatList.slice().reverse() : store.state.chatList.slice()" :key="i">
            <div :class="chat.type" v-if="chat.type=='message'">
              <div class="optionIcon" :class="chat.message_type"></div>
              <div class="message" :class="{ 'mine': chat.username === userName, 'mentioned': chat.mentionTo === userName, 'others':  (chat.mentionTo && chat.mentionTo !== userName)}">
                <p>{{messageTitle(chat)}}</p>
                <p class="messageContent" @click="showReply(chat.username, chat.chatID, chat.message)" v-html="chat.message"></p>
                <div class="button-container" :class="{'responsive-flex': chat.consult_timelimit!=null}">
                  <pre><button @click="onReply(chat)">返信</button></pre>
                  <pre v-if="chat.consult_timelimit==null"><button @click="onComfirmReply(chat.username, chat.chatID, chat.message), isSubDisplay=true">確認</button></pre>
                  <div class="consult-option notes" v-if="chat.consult_timelimit!=null">{{ "※回答期限："+chat.consult_timelimit.replace(/(.*?)-/, "-").replace("T", " ").replace(/-(.*?)-/g, '$1/') }}</div>
                </div>
              </div>
            </div>
            <pre :class="['custom-enter', chat.type]" v-if="chat.type=='enter_message'">{{ chat.message }}</pre>
            <pre :class="['custom-leave', chat.type]" v-if="chat.type=='leave_message'">{{ chat.message }}</pre>
          </li>
        </ul>
      </div>

      <div v-if="isSubDisplay" class="sub-display" :class="{'sub-only': !isMainDisplay}">
        <div class="memo" v-if="!isReplyShow">
          <div class="flex">
            <p class="user-memo">{{ userName }}さん専用メモ</p>
            <button class="big" v-if="isMainDisplay" @click="isMainDisplay=false"><img src="../images/big-icon.png" alt=""></button>
            <button class="small" v-if="!isMainDisplay" @click="isMainDisplay=true"><img src="../images/small-icon.png" alt=""></button>
            <button class="close" v-if="isMainDisplay" @click="isSubDisplay=false"><img src="../images/close.png" alt="x"></button>
          </div>
          <div class="personal-memoStyle">
            <ul>
              <li v-for="(memo, i) in memoList.slice().reverse()" :key="i">
                <p v-html="memo.message"></p>
              </li>
            </ul>
          </div>
        </div>

        <div class="memo reply" v-if="isReplyShow">
          <div class="flex">
            <button id="memo-show" @click="isReplyShow=false">メモ一覧を表示</button>
            <div class="size-button">
              <button class="big" v-if="isMainDisplay" @click="isMainDisplay=false"><img src="../images/big-icon.png" alt=""></button>
              <button class="small" v-if="!isMainDisplay" @click="isMainDisplay=true"><img src="../images/small-icon.png" alt=""></button>
              <button v-if="isMainDisplay" @click="isSubDisplay=false"><img src="../images/close.png" alt="x"></button>
            </div>
          </div>
          <div class="message-content">
            <pre>{{replyMessageName}}</pre>
            <div><p class="messageContent-forcus" v-html="replyMessageContent"></p></div>
          </div>
          <div class="reply-content">
            <ul>
              <li v-for="(reply, i) in filteredReplyList.slice().reverse()" :key="i">
                <div class="user-name">{{reply.username}}</div>
                <div v-html="reply.replycontent" class="content"></div>
              </li>
            </ul>
            </div>
          <div>
            <textarea v-model="replyContent" rows="4" class="area" placeholder="返信文を入力"></textarea>
            <div class="mt-5">
              <button class="button-normal" @click="onPublishReply">返信</button>
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>

    <router-link to="/">
      <button type="button" class="exit-button" @click="onExit">退室する</button>
    </router-link>
</template>
