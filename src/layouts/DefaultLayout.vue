<template>
    <Header></Header>
    <RouterView></RouterView>
    <Footer></Footer>
</template>

<script>
import AppFooter from '../components/AppFooter.vue';
import AppHeader from '../components/AppHeader.vue';

export default {
    name: 'DefaultLayout',
    components: {
        Header: AppHeader,
        Footer: AppFooter,
    }
}
</script>
