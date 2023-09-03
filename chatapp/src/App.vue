<script setup>
import { provide, ref } from "vue"

// #region reactive state
const userName = ref("")
const chatContent = ref("")
// #endregion

// #region global variable
provide("userName", userName)
provide("chatContent", chatContent)
// #endregion
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
