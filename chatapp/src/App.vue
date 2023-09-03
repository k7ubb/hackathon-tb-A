<script setup>
import { provide, ref } from "vue"

// #region reactive state
const userName = ref("")
const chatContent = ref("")
const chat_type = ref("")
const chat_id = ref(0)
// #endregion

// #region global variable
provide("userName", userName)
provide("chatContent", chatContent)
provide("chat_type", chat_type)
provide("chat_id", chat_id)
// #endregion
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
