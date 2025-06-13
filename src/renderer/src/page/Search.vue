<template>
  <div id="searchpage">
    <input v-model="message" type="text" placeholder="输入好友id或群id" />
    <button @click="search">add</button>
    <button @click="back">back</button>
  </div>
</template>

<script setup lang="ts">
import { FriendRequest, FriendRequestType } from '@apiType/HttpRequest'
import { friend_add } from '@renderer/ipcApi'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const message = ref('')
const back = (): void => {
  router.push('/chat')
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const search = async () => {
  const request: FriendRequest = {
    request_type: FriendRequestType.Add,
    id: Number(message.value)
  }
  const result = await friend_add(request)
  if (result.action == 'generic_response') {
    if (result.status == 'Ok') {
      console.log('添加成功')
      router.push('/chat')
    }
  }
}
</script>
