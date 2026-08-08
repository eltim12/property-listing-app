<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppShell from "@/layouts/AppShell.vue";
import Toaster from "@/components/ui/Toaster.vue";

const route = useRoute();
const useShell = computed(() => route.meta.requiresAuth);
</script>

<template>
  <AppShell v-if="useShell">
    <router-view />
  </AppShell>
  <router-view v-else />
  <Toaster />
</template>
