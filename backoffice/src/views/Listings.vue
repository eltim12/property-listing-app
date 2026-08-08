<script setup>
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Pencil, Plus, Search, Trash2 } from "@lucide/vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import Input from "@/components/ui/Input.vue";
import { useI18n } from "@/composables/useI18n";
import { useToast } from "@/composables/useToast";
import api from "@/services/api";
import { formatIdr } from "@/utils/formatters";

const router = useRouter();
const { t, locale } = useI18n();
const { showToast } = useToast();

const loading = ref(false);
const listings = ref([]);
const search = ref("");
const showDelete = ref(false);
const pendingDelete = ref(null);
const deleting = ref(false);

async function load() {
  loading.value = true;
  try {
    const data = await api.getListings({
      q: search.value.trim() || undefined,
    });
    listings.value = data.listings || [];
  } catch (error) {
    showToast(error.response?.data?.error || "Failed to load", "error");
  } finally {
    loading.value = false;
  }
}

let searchTimer;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 300);
});

onMounted(load);

function titleOf(row) {
  return locale.value === "zh" ? row.title_zh : row.title_en;
}

function availabilityLabel(row) {
  if (row.availability === "closed") {
    return row.deal_type === "sell"
      ? locale.value === "zh"
        ? "已售"
        : "Sold"
      : locale.value === "zh"
        ? "已租"
        : "Rented";
  }
  return t("open");
}

function confirmDelete(row) {
  pendingDelete.value = row;
  showDelete.value = true;
}

async function doDelete() {
  if (!pendingDelete.value) return;
  deleting.value = true;
  try {
    await api.deleteListing(pendingDelete.value.id);
    showToast(t("deleted"), "success");
    showDelete.value = false;
    pendingDelete.value = null;
    await load();
  } catch (error) {
    showToast(error.response?.data?.error || "Delete failed", "error");
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-neutral-900">
          {{ t("listingsTitle") }}
        </h1>
        <p class="text-sm text-neutral-500">{{ t("listingsSubtitle") }}</p>
      </div>
      <Button class="h-11" @click="router.push('/listings/new')">
        <Plus class="h-4 w-4" />
        {{ t("addListing") }}
      </Button>
    </div>

    <div class="relative max-w-md">
      <Search
        class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
      />
      <Input
        v-model="search"
        class="h-11 pl-9"
        :placeholder="t('searchPlaceholder')"
      />
    </div>

    <Card class="overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="min-w-max w-full text-sm">
          <thead class="bg-neutral-50 text-left">
            <tr>
              <th class="px-4 py-3 font-medium text-neutral-500">ID</th>
              <th class="px-4 py-3 font-medium text-neutral-500">
                {{ t("titleEn") }}
              </th>
              <th class="px-4 py-3 font-medium text-neutral-500">
                {{ t("city") }}
              </th>
              <th class="px-4 py-3 font-medium text-neutral-500">
                {{ t("sourceName") }}
              </th>
              <th class="px-4 py-3 font-medium text-neutral-500">
                {{ t("priceIdr") }}
              </th>
              <th class="px-4 py-3 font-medium text-neutral-500">
                {{ t("visibility") }}
              </th>
              <th class="px-4 py-3 font-medium text-neutral-500">
                {{ t("availability") }}
              </th>
              <th class="px-4 py-3 font-medium text-neutral-500">
                {{ t("actions") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="px-4 py-8 text-center text-neutral-500">
                {{ t("loading") }}
              </td>
            </tr>
            <tr v-else-if="!listings.length">
              <td colspan="8" class="px-4 py-8 text-center text-neutral-500">
                {{ t("emptyListings") }}
              </td>
            </tr>
            <tr
              v-for="row in listings"
              :key="row.id"
              class="border-t border-neutral-100"
            >
              <td class="px-4 py-3 font-mono text-neutral-500">#{{ row.id }}</td>
              <td class="px-4 py-3 font-medium text-neutral-900">
                {{ titleOf(row) }}
                <p
                  v-if="row.internal_note"
                  class="mt-0.5 max-w-xs truncate text-xs font-normal text-neutral-400"
                  :title="row.internal_note"
                >
                  {{ row.internal_note }}
                </p>
              </td>
              <td class="px-4 py-3">{{ row.city }}</td>
              <td class="px-4 py-3 text-neutral-600">
                {{ row.source_name || "—" }}
              </td>
              <td class="px-4 py-3 font-mono">{{ formatIdr(row.price_idr) }}</td>
              <td class="px-4 py-3">
                <Badge
                  :class="
                    row.visibility === 'published'
                      ? 'border-transparent bg-neutral-900 text-white'
                      : ''
                  "
                >
                  {{ t(row.visibility) }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <Badge
                  :class="
                    row.availability === 'open'
                      ? 'border-transparent bg-emerald-100 text-emerald-700'
                      : 'border-transparent bg-amber-100 text-amber-800'
                  "
                >
                  {{ availabilityLabel(row) }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    @click="router.push(`/listings/${row.id}`)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="text-red-600"
                    @click="confirmDelete(row)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <ConfirmDialog
      :open="showDelete"
      :title="t('confirmDelete')"
      :description="t('confirmDeleteDesc')"
      :loading="deleting"
      @update:open="showDelete = $event"
      @confirm="doDelete"
    />
  </div>
</template>
