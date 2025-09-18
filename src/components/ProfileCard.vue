<script setup>
import { useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { ref, computed, onMounted } from "vue";

const route = useRoute();
const store = useAuthStore();
const user = computed(() => store.loggedUser);

const profileData = ref(null);
const showFullProfile = ref(false);

onMounted(async () => {
  if (route.path === "/eu") {
    profileData.value = await store.getProfileById(user.value.id);
  }
});
</script>

<template>
  <div class="profile-card">
    <div class="profile-card__header">
      <div class="profile-card__image"></div>
      <div class="profile-card__title">
        <h2>{{ user.name }}</h2>
        <div class="profile-card__address">
          <i class="bi bi-geo-alt"></i>
          <p>{{ profileData?.data.address || "Não informado" }}</p>
        </div>
      </div>
    </div>
    <div v-if="showFullProfile" class="profile-card__content">
      <div class="profile-card__bio">
        <h3>Bio</h3>
        <p>{{ profileData?.data.bio }}</p>
      </div>
    </div>
    <div class="profile-card__chevron-icon">
      <i :class="[
        showFullProfile ? 'bi bi-chevron-compact-up' : 'bi bi-chevron-compact-down',
        'chevron-icon'
      ]" @click="showFullProfile = !showFullProfile" aria-label="Mostrar mais"></i>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "@/scss/variables";
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.profile-card {
  background-color: #faf9f9;
  border-radius: 16px;
  padding: 24px 16px;
  box-shadow: 1px 1px 4px 1px #0000001A;

  @include md {
    margin-right: 20px;
    padding: 24px 24px;
  }

  &__header {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 8px;

    @include md {
      gap: 0;
      margin-bottom: 16px;
    }
  }

  &__image {
    width: 70px;
    height: 70px;
    background-color: $color-laranja-e;

    @include md {
      margin-bottom: 12px
    }
  }

  &__title {
    @include md {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    h2 {
      font-family: "DM Sans";
      font-weight: 500;
      font-style: Medium;
      font-size: 16px;
      line-height: 150%;
      letter-spacing: 0%;
      text-align: center;

      @include md {
        font-size: 20px;
      }
    }
  }

  &__address {
    display: flex;
    flex-direction: row;
    gap: 5px;

    p {
      color: $color-cinza-m;
      font-family: "DM Sans";
      font-weight: 400;
      font-style: 9pt Regular;
      font-size: 12px;
      line-height: 115%;
      letter-spacing: 0%;

      @include md {
        font-size: 14px;
        margin-bottom: 0;
      }
    }

    .bi-geo-alt {
      font-size: 12px;
      color: #636262;
    }
  }

  &__content {
    >*+* {
      margin-top: 30px;
    }

    margin-bottom: 30px;

    h4 {
      color: #636262;
      font-weight: 700;
      font-size: 16px;
      line-height: 115%;
      letter-spacing: 0%;
    }

    p {
      color: #636262;
      font-weight: 300;
      font-size: 14px;
      line-height: 125%;
      letter-spacing: 0%;
      margin-bottom: 0;
    }
  }

  &__chevron-icon {
    display: flex;
    flex-direction: column;
    align-items: center;

    i {
      cursor: pointer;
      font-size: 28px;
    }
  }
}
</style>