<script setup>
    // Props
    const props = defineProps({
        instructionsTitle: {
            type: String,
            default: "Você ainda não<br />tem coleções.",
        },        
    });

    // Methods
    function handleClick() {
        console.log("Cliquei na caixa de upload de coleção");
    }

</script>

<template>

    <!-- Caixa de upload inicial -->
    <section class="upload-collection-box" @click="handleClick">
        <div class="upload-collection-box__content">
            <h2 class="upload-collection-box__title" v-html="instructionsTitle"></h2>
            <i class="bi bi-plus-circle-fill upload-collection-box__icon"></i>
            <p class="upload-collection-box__subtitle">clique aqui para criar uma</p>
        </div>
    </section>

</template>

<style lang="scss" scoped>
.upload-collection-box {
  width: 100%;
  min-height: 515px;
  box-sizing: border-box;

  border: 2px solid #636262;
  border-radius: 7px;
  background: #faf9f9;
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);

  cursor: pointer;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-collection-box__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24.6px;
  text-align: center;
}

.upload-collection-box__title {
  margin: 0;
  color: #000;
  font-family: "DM Sans", sans-serif;
  font-size: 30px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: center;
}

.upload-collection-box__icon {
  color: #0f59a5;
  font-size: 50px;
  line-height: 1;
}

.upload-collection-box__subtitle {
  margin: 0;
  color: #000;
  font-family: "Istok Web", sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
  text-transform: lowercase;
}

@media (max-width: 767px) {
  .upload-collection-box {
    min-height: 360px;
  }

  .upload-collection-box__title {
    font-size: 30px;
  }

  .upload-collection-box__icon {
    font-size: 32px;
  }
}
</style>