<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "@lucide/vue";
import UploadImage from "@/components/UploadImage.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import Select from "@/components/ui/Select.vue";
import SelectContent from "@/components/ui/SelectContent.vue";
import SelectGroup from "@/components/ui/SelectGroup.vue";
import SelectItem from "@/components/ui/SelectItem.vue";
import SelectTrigger from "@/components/ui/SelectTrigger.vue";
import SelectValue from "@/components/ui/SelectValue.vue";
import { useI18n } from "@/composables/useI18n";
import { useToast } from "@/composables/useToast";
import api from "@/services/api";
import { mediaUrl } from "@/utils/formatters";

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { showToast } = useToast();

const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(false);
const saving = ref(false);
const amenities = ref([]);
const existingImages = ref([]);
const newFiles = ref([]);

const form = ref({
  title_zh: "",
  title_en: "",
  description_zh: "",
  description_en: "",
  property_type: "warehouse",
  deal_type: "rent",
  price_idr: "",
  area_sqm: "",
  city: "",
  district: "",
  address: "",
  visibility: "draft",
  availability: "open",
  source_name: "",
  internal_note: "",
  amenity_ids: [],
});

const propertyItems = computed(() => [
  { value: "factory", label: t("factory") },
  { value: "warehouse", label: t("warehouse") },
]);
const dealItems = computed(() => [
  { value: "rent", label: t("rent") },
  { value: "sell", label: t("sell") },
]);
const visibilityItems = computed(() => [
  { value: "draft", label: t("draft") },
  { value: "published", label: t("published") },
]);
const availabilityItems = computed(() => [
  { value: "open", label: t("open") },
  { value: "closed", label: t("closed") },
]);

onMounted(async () => {
  loading.value = true;
  try {
    const amenityData = await api.getAmenities();
    amenities.value = amenityData.amenities || [];

    if (isEdit.value) {
      const data = await api.getListing(route.params.id);
      const listing = data.listing;
      form.value = {
        title_zh: listing.title_zh,
        title_en: listing.title_en,
        description_zh: listing.description_zh,
        description_en: listing.description_en,
        property_type: listing.property_type,
        deal_type: listing.deal_type,
        price_idr: String(listing.price_idr),
        area_sqm: String(listing.area_sqm),
        city: listing.city,
        district: listing.district,
        address: listing.address,
        visibility: listing.visibility,
        availability: listing.availability,
        source_name: listing.source_name || "",
        internal_note: listing.internal_note || "",
        amenity_ids: (listing.amenities || []).map((a) => a.id),
      };
      existingImages.value = (listing.images || []).map((img) => ({
        id: img.id,
        url: mediaUrl(img.url || img.path),
      }));
    }
  } catch (error) {
    showToast(error.response?.data?.error || "Failed to load", "error");
  } finally {
    loading.value = false;
  }
});

function toggleAmenity(id) {
  const set = new Set(form.value.amenity_ids);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  form.value.amenity_ids = [...set];
}

async function onExistingRemoved(image) {
  if (!isEdit.value || !image?.id) return;
  try {
    const data = await api.deleteListingImage(route.params.id, image.id);
    existingImages.value = (data.images || []).map((img) => ({
      id: img.id,
      url: mediaUrl(img.url || img.path),
    }));
  } catch (error) {
    showToast(error.response?.data?.error || "Failed to delete image", "error");
  }
}

async function save() {
  if (!form.value.title_zh || !form.value.title_en) {
    showToast("Title required", "error");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      price_idr: Number(form.value.price_idr),
      area_sqm: Number(form.value.area_sqm),
    };

    let listingId = route.params.id;
    if (isEdit.value) {
      await api.updateListing(listingId, payload);
    } else {
      const created = await api.createListing(payload);
      listingId = created.listing.id;
    }

    const files = Array.isArray(newFiles.value)
      ? newFiles.value
      : newFiles.value
        ? [newFiles.value]
        : [];
    if (files.length) {
      try {
        await api.uploadListingImages(listingId, files);
      } catch (uploadError) {
        showToast(
          uploadError.response?.data?.error ||
            "Listing saved, but media upload failed. Edit the listing to retry.",
          "error",
        );
        router.push(isEdit.value ? `/listings/${listingId}` : `/listings/${listingId}`);
        return;
      }
    }

    showToast(t("saved"), "success");
    router.push("/");
  } catch (error) {
    showToast(error.response?.data?.error || "Save failed", "error");
  } finally {
    saving.value = false;
  }
}

function amenityLabel(a) {
  return locale.value === "zh" ? a.label_zh : a.label_en;
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="router.push('/')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-2xl font-semibold text-neutral-900">
        {{ isEdit ? t("editListing") : t("createListing") }}
      </h1>
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">{{ t("loading") }}</p>

    <form v-else class="space-y-5" @submit.prevent="save">
      <Card class="space-y-4 rounded-xl bg-neutral-50 p-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>{{ t("visibility") }}</Label>
            <Select v-model="form.visibility" :items="visibilityItems">
              <SelectTrigger class="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="item in visibilityItems"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>{{ t("availability") }}</Label>
            <Select v-model="form.availability" :items="availabilityItems">
              <SelectTrigger class="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="item in availabilityItems"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card class="space-y-4 p-4 md:p-6">
        <div class="space-y-2">
          <Label>{{ t("titleZh") }}</Label>
          <Input v-model="form.title_zh" class="h-11" required />
        </div>
        <div class="space-y-2">
          <Label>{{ t("titleEn") }}</Label>
          <Input v-model="form.title_en" class="h-11" required />
        </div>
        <div class="space-y-2">
          <Label>{{ t("descriptionZh") }}</Label>
          <textarea
            v-model="form.description_zh"
            rows="4"
            class="flex w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus-visible:border-neutral-400"
            required
          />
        </div>
        <div class="space-y-2">
          <Label>{{ t("descriptionEn") }}</Label>
          <textarea
            v-model="form.description_en"
            rows="4"
            class="flex w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus-visible:border-neutral-400"
            required
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>{{ t("propertyType") }}</Label>
            <Select v-model="form.property_type" :items="propertyItems">
              <SelectTrigger class="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="item in propertyItems"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>{{ t("dealType") }}</Label>
            <Select v-model="form.deal_type" :items="dealItems">
              <SelectTrigger class="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="item in dealItems"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>{{ t("priceIdr") }}</Label>
            <Input
              v-model="form.price_idr"
              type="number"
              min="0"
              class="h-11 font-mono"
              required
            />
          </div>
          <div class="space-y-2">
            <Label>{{ t("areaSqm") }}</Label>
            <Input
              v-model="form.area_sqm"
              type="number"
              min="0"
              step="0.01"
              class="h-11 font-mono"
              required
            />
          </div>
          <div class="space-y-2">
            <Label>{{ t("city") }}</Label>
            <Input v-model="form.city" class="h-11" required />
          </div>
          <div class="space-y-2">
            <Label>{{ t("district") }}</Label>
            <Input v-model="form.district" class="h-11" />
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t("address") }}</Label>
          <Input v-model="form.address" class="h-11" />
        </div>

        <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-4">
          <div>
            <p class="text-sm font-semibold text-neutral-900">
              {{ t("internalSection") }}
            </p>
            <p class="text-xs text-neutral-500">{{ t("internalSectionHint") }}</p>
          </div>
          <div class="space-y-2">
            <Label>{{ t("sourceName") }}</Label>
            <Input
              v-model="form.source_name"
              class="h-11 bg-white"
              :placeholder="t('sourceNamePlaceholder')"
            />
          </div>
          <div class="space-y-2">
            <Label>{{ t("internalNote") }}</Label>
            <textarea
              v-model="form.internal_note"
              rows="4"
              class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
              :placeholder="t('internalNotePlaceholder')"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t("amenities") }}</Label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="a in amenities"
              :key="a.id"
              type="button"
              class="rounded-lg border px-3 py-2 text-sm transition-colors"
              :class="
                form.amenity_ids.includes(a.id)
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              "
              @click="toggleAmenity(a.id)"
            >
              {{ amenityLabel(a) }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t("images") }}</Label>
          <UploadImage
            v-model="newFiles"
            multiple
            accept="image/*,video/*"
            :existing-images="existingImages"
            :hint="t('uploadHint')"
            @existing-removed="onExistingRemoved"
          />
        </div>
      </Card>

      <div class="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          class="h-11 w-full"
          @click="router.push('/')"
        >
          {{ t("cancel") }}
        </Button>
        <Button type="submit" class="h-11 w-full" :loading="saving">
          {{ t("save") }}
        </Button>
      </div>
    </form>
  </div>
</template>
