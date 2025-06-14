<template>
  <div id="searchpage">
    <div class="search-card">
      <h2>添加好友或群组</h2>
      <input v-model="message" type="text" placeholder="请输入好友ID或群ID" />
      <div class="btn-group">
        <button class="btn add" @click="search">添加</button>
        <button class="btn back" @click="back">返回</button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { FriendRequest, FriendRequestType } from '@apiType/HttpRequest'
import { friend_add } from '@renderer/ipcApi'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
      ElMessage('添加成功')
      console.log('添加成功')
      router.push('/chat')
    }
  }
}
</script>

<style scoped>
#searchpage {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to right, #e0eafc, #cfdef3);
  font-family: 'Segoe UI', sans-serif;
}

.search-card {
  background-color: #ffffff;
  padding: 30px 40px;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 320px;
}

.search-card h2 {
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
}

input[type="text"] {
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.2s ease;
}

input[type="text"]:focus {
  border-color: #4a90e2;
  outline: none;
}

.btn-group {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn.add {
  background-color: #4caf50;
  color: white;
}

.btn.add:hover {
  background-color: #45a049;
}

.btn.back {
  background-color: #f44336;
  color: white;
}

.btn.back:hover {
  background-color: #d32f2f;
}
</style>
