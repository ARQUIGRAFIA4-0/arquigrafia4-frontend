<template>
  <div class="user-card">
    <div class="user-card__media">
      <img class="user-card__image"
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLrxyOq7aJoitKoEtD5jHqb3JEjkD0g5w9Pg&s"
        alt="foto do usuário" />
    </div>
    <div class="user-card__body">
      <h3 class="user-card__name">Yumi Tanaka</h3>
      <ul class="user-card__tags">
        <li class="user-card__tag">Termo</li>
        <li class="user-card__tag user-card__tag--overflow">+4</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;
$breakpoint-sm: 425px;

.user-card {
  max-width: 220px;
  // max-height: 337px;
  // min-height: 211px;
  height: 100%;
  width: 100%;
  background-color: var(--Off_white, #f8f8f8);
  // color: var(--branco, #ffffff);
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  border-radius: 0.25rem;
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);

  &__media {
    width: 100%;
    aspect-ratio: 1 / 1;
    max-height: 220px;
    overflow: hidden;

    @media (max-width: $breakpoint-sm) {
      max-height: 142px;
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 0.25rem 0.25rem 0 0;
  }

  &__body {
    padding: 0.75rem 0.5rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;

    @media (max-width: $breakpoint-sm) {
      padding: 0.5rem;
      gap: 0.5rem;
    }
  }

  &__name {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--Preto, #1a1a1a);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: $breakpoint-sm) {
      font-size: 0.75rem;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__tag {
    background-color: var(--branco, #ffffff);
    color: var(--Cinza_M, #a6a6a6);
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--Cinza_M, #a6a6a6);
    border-radius: 2px;
    font-size: 0.75rem;

    @media (max-width: $breakpoint-sm) {
      font-size: 0.625rem;
    }
  }

  @media (max-width: $breakpoint-sm) {
    max-width: 142px;
  }
}
</style>