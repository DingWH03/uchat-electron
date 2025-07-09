<template>
  <div class="profile-container">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2>个人信息</h2>
      <el-button v-if="!isEditing" type="primary" @click="startEdit" size="small">修改</el-button>
      <template v-else>
        <el-button type="primary" @click="saveProfile" size="small">保存</el-button>
        <el-button @click="cancelEdit" size="small">取消</el-button>
      </template>
    </div>
    <div class="profile-info">
      <el-upload
        class="avatar-uploader"
        :show-file-list="false"
        :before-upload="beforeAvatarUpload"
        :http-request="handleAvatarUpload"
        :disabled="!isEditing"
      >
        <el-avatar :src="user.avatar" size="large" class="avatar" />
        <div class="avatar-upload-text">点击更换头像</div>
      </el-upload>
      <el-form :model="user" label-width="80px" class="profile-form">
        <el-form-item label="用户名">
          <el-input v-model="user.username" :disabled="!isEditing" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, UploadRequestOptions } from 'element-plus'
import { getMe, uploadAvatar, updateMe } from '../ipcApi'
import { getSecureAvatarUrl } from '../utils/fileUtils'
import { ApiResponse, ErrorResult } from '@apiType/Model'

const user = ref({
  avatar: '',
  username: ''
})
const originalUser = ref({ avatar: '', username: '' })
const isEditing = ref(false)

const fetchUser = async (): Promise<void> => {
  const res = await getMe()
  if (res.success && res.data) {
    user.value.username = res.data.username || ''
    user.value.avatar = await getSecureAvatarUrl(res.data.avatar_url)
    originalUser.value = { ...user.value }
  }
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

const beforeAvatarUpload = (file: File): boolean => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
  }
  return isImage && isLt2M
}

const handleAvatarUpload = async (option: UploadRequestOptions): Promise<void> => {
  if (!isEditing.value) return
  const file = option.file
  // 读取文件为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const res: ApiResponse<string> = await uploadAvatar({
    name: file.name,
    type: file.type,
    buffer: arrayBuffer
  })
  if (res.success && res.data) {
    // 上传后用getLocalFile获取本地路径，然后转换为安全URL
    user.value.avatar = await getSecureAvatarUrl(res.data)
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
  max-width: 400px;
  margin: 40px auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px 24px;
}
.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  cursor: pointer;
}
.avatar {
  width: 96px;
  height: 96px;
  margin-bottom: 8px;
}
.avatar-upload-text {
  font-size: 13px;
  color: #888;
}
.profile-form {
  width: 100%;
  margin-top: 16px;
}
</style>
