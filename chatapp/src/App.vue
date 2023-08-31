<script setup>
import { provide, ref } from "vue"

// #region reactive state
const userName = ref("")
const chatContent = ref("")
const chat_type = ref("")
// #endregion

// #region global variable
provide("userName", userName)
provide("chatContent", chatContent)
provide("chat_type", chat_type)
// #endregion
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
