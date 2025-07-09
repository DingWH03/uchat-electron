<template>
  <UserProfileCard
    :user="user"
    mode="self"
    :is-editing="isEditing"
    title="个人信息"
    @edit="startEdit"
    @save="saveProfile"
    @cancel="cancelEdit"
    @avatar-change="onAvatarFileChange"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadAvatar, updateMe } from '../ipcApi'
import { ApiResponse, ErrorResult } from '@apiType/Model'
import { avatarStore } from '../stores/avatarStore'
import UserProfileCard from '../components/UserProfileCard.vue'

const { currentUser, loadCurrentUser } = avatarStore

const user = ref({ avatar: '', username: '' })
const originalUser = ref({ avatar: '', username: '' })
const isEditing = ref(false)

const fetchUser = async (): Promise<void> => {
  if (!currentUser.value) {
    await loadCurrentUser()
  }
  user.value = {
    avatar: currentUser.value?.avatarUrl || '',
    username: currentUser.value?.username || ''
  }
  originalUser.value = { ...user.value }
}

onMounted(fetchUser)

const startEdit = (): void => {
  isEditing.value = true
  originalUser.value = { ...user.value }
}
const cancelEdit = (): void => {
  user.value = { ...originalUser.value }
  isEditing.value = false
}

const onAvatarFileChange = async (e: Event): Promise<void> => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  const file = files[0]
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return
  }
  // 读取文件为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const res: ApiResponse<string> = await uploadAvatar({
    name: file.name,
    type: file.type,
    buffer: arrayBuffer
  })
  if (res.success && res.data) {
    if (currentUser.value) {
      const { getSecureAvatarUrl } = await import('../utils/fileUtils')
      const secureUrl = await getSecureAvatarUrl(res.data)
      currentUser.value.avatarUrl = secureUrl
      user.value.avatar = secureUrl
      // 更新缓存
      const cacheKey = `user-${currentUser.value.userId}`
      avatarStore.avatarCache[cacheKey] = {
        url: secureUrl,
        timestamp: Date.now(),
        loading: false
      }
    }
    ElMessage.success('头像上传成功!')
  } else {
    const { error } = res as ErrorResult
    ElMessage.error(`头像上传失败：${error}`)
  }
}

const saveProfile = async (): Promise<void> => {
  const res = await updateMe({ username: user.value.username })
  if (res.success) {
    ElMessage.success('个人信息已更新!')
    isEditing.value = false
    fetchUser()
  } else {
    ElMessage.error('更新失败!')
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 420px;
  margin: 48px auto;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  padding: 36px 28px 32px 28px;
}
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
  cursor: pointer;
  position: relative;
}
.avatar {
  width: 104px;
  height: 104px;
  margin-bottom: 10px;
  border: 2px solid #e6e6e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;
}
.avatar-wrapper:hover .avatar {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.avatar-upload-text {
  font-size: 13px;
  color: #888;
  margin-bottom: 2px;
}
.profile-form {
  width: 100%;
  margin-top: 16px;
}
</style>
