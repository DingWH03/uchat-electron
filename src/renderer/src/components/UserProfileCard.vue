<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>{{ title }}</h2>
      <template v-if="mode === 'self'">
        <el-button v-if="!isEditing" type="primary" size="small" @click="$emit('edit')"
          >编辑资料</el-button
        >
        <template v-else>
          <el-button type="primary" size="small" @click="$emit('save')">保存</el-button>
          <el-button size="small" @click="$emit('cancel')">取消</el-button>
        </template>
      </template>
    </div>
    <div class="profile-info">
      <div class="avatar-wrapper" @click="onAvatarClick">
        <el-avatar :src="user.avatar" size="large" class="avatar" />
        <div class="avatar-upload-text">
          <template v-if="mode === 'self'">
            {{ isEditing ? '点击更换头像' : '点击查看大图' }}
          </template>
          <template v-else> 点击查看大图 </template>
        </div>
        <input
          v-if="mode === 'self' && isEditing"
          ref="avatarInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="$emit('avatar-change', $event)"
        />
      </div>
      <el-dialog v-model="avatarDialogVisible" width="320px" :show-close="true" center>
        <img :src="user.avatar" alt="头像预览" style="width: 100%; border-radius: 8px" />
      </el-dialog>
      <el-form :model="user" label-width="80px" class="profile-form">
        <el-form-item v-if="user.username" label="用户名">
          <el-input v-if="mode === 'self' && isEditing" v-model="user.username" />
          <span v-else>{{ user.username }}</span>
        </el-form-item>
        <el-form-item v-if="user.userId" label="用户ID">
          <span>{{ user.userId }}</span>
        </el-form-item>
        <el-form-item v-if="user.groupName" label="群名称">
          <span>{{ user.groupName }}</span>
        </el-form-item>
        <el-form-item v-if="user.groupId" label="群ID">
          <span>{{ user.groupId }}</span>
        </el-form-item>
        <slot />
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
  mode: { type: String, default: 'self' }, // self/friend/group
  isEditing: { type: Boolean, default: false },
  title: { type: String, default: '个人信息' }
})
defineEmits(['edit', 'save', 'cancel', 'avatar-change'])
const avatarDialogVisible = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

const onAvatarClick = (): void => {
  if (props.mode === 'self' && props.isEditing) {
    avatarInput.value?.click()
  } else {
    avatarDialogVisible.value = true
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
