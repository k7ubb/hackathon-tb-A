<script setup>
import { inject } from "vue"
import { useRouter } from "vue-router"

const router = useRouter();

const message = inject("message")

const onClick = () =>{
  message.value = "Hello Vue.js!"
  router.push({ name: "hello"})
}

</script>

<template>
  <div>{{ message }}</div>
</template>