<script setup>
import { onMounted, ref } from "vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import { useI18n } from "@/composables/useI18n";
import { useToast } from "@/composables/useToast";
import api from "@/services/api";

const { t } = useI18n();
const { showToast } = useToast();
const loading = ref(false);
const saving = ref(false);
const form = ref({
  contact_name: "",
  contact_phone: "",
  contact_whatsapp: "",
  contact_email: "",
  brand_name_en: "",
  brand_name_zh: "",
});

onMounted(async () => {
  loading.value = true;
  try {
    form.value = await api.getSettings();
  } catch (error) {
    showToast(error.response?.data?.error || "Failed to load", "error");
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  try {
    form.value = await api.updateSettings(form.value);
    showToast(t("saved"), "success");
  } catch (error) {
    showToast(error.response?.data?.error || "Save failed", "error");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-5">
    <div>
      <h1 class="text-2xl font-semibold text-neutral-900">
        {{ t("settingsTitle") }}
      </h1>
      <p class="text-sm text-neutral-500">{{ t("settingsSubtitle") }}</p>
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">{{ t("loading") }}</p>

    <Card v-else class="space-y-4 p-4 md:p-6">
      <form class="space-y-4" @submit.prevent="save">
        <div class="space-y-2">
          <Label>{{ t("contactName") }}</Label>
          <Input v-model="form.contact_name" class="h-11" required />
        </div>
        <div class="space-y-2">
          <Label>{{ t("contactPhone") }}</Label>
          <Input v-model="form.contact_phone" class="h-11" />
        </div>
        <div class="space-y-2">
          <Label>{{ t("contactWhatsapp") }}</Label>
          <Input v-model="form.contact_whatsapp" class="h-11" />
        </div>
        <div class="space-y-2">
          <Label>{{ t("contactEmail") }}</Label>
          <Input v-model="form.contact_email" type="email" class="h-11" />
        </div>
        <div class="space-y-2">
          <Label>{{ t("brandNameEn") }}</Label>
          <Input v-model="form.brand_name_en" class="h-11" />
        </div>
        <div class="space-y-2">
          <Label>{{ t("brandNameZh") }}</Label>
          <Input v-model="form.brand_name_zh" class="h-11" />
        </div>
        <div class="flex justify-end">
          <Button type="submit" class="h-11" :loading="saving">
            {{ t("save") }}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>
