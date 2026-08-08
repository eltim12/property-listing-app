<script setup>
import { onUnmounted, reactive, ref, watch } from "vue";
import { CheckCircle2, ImageIcon, Upload, X } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import { useI18n } from "@/composables/useI18n";
import { cn } from "@/lib/utils";
import { compressImageToBlob } from "@/utils/imageCompression";
import {
  compressVideoToBlob,
  videoExtensionForMime,
} from "@/utils/videoCompression";

const props = defineProps({
  modelValue: {
    type: [File, Array],
    default: null,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  accept: {
    type: String,
    default: "image/*",
  },
  hint: {
    type: String,
    default: "",
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024,
  },
  maxVideoSize: {
    type: Number,
    default: 25 * 1024 * 1024,
  },
  maxFiles: {
    type: Number,
    default: 12,
  },
  existingImages: {
    type: Array,
    default: () => [],
  },
  showExisting: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "upload-progress",
  "file-added",
  "file-removed",
  "existing-removed",
]);

const { t } = useI18n();
const uploadZone = ref(null);
const fileInput = ref(null);
const isDragOver = ref(false);
const fileList = ref([]);
const previewImageUrl = ref(null);
let fileIdCounter = 0;

function generateFileId() {
  return `file-${Date.now()}-${fileIdCounter++}`;
}

function getImageUrl(image) {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object") {
    return image.url || image.image_url || image.path || image.base64 || null;
  }
  return null;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function isVideoUrl(src) {
  return typeof src === "string" && /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(src);
}

function isVideoFile(file) {
  return (
    file?.file?.type?.startsWith("video/") ||
    /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(file?.name || "") ||
    (typeof file?.preview === "string" && file.preview.startsWith("data:video"))
  );
}

function guessMimeFromName(name = "") {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".ogg") || lower.endsWith(".ogv")) return "video/ogg";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "";
}

/** Ensure File has a usable MIME type (iOS often sends empty/octet-stream). */
function ensureTypedFile(file, fallbackType = "") {
  const type =
    file.type && file.type !== "application/octet-stream"
      ? file.type
      : guessMimeFromName(file.name) || fallbackType || "application/octet-stream";
  if (file.type === type && file instanceof File) return file;
  return new File([file], file.name || `upload-${Date.now()}`, {
    type,
    lastModified: file.lastModified || Date.now(),
  });
}

function canCompressVideoInBrowser() {
  if (typeof MediaRecorder === "undefined") return false;
  // iOS Safari MediaRecorder/canvas capture is unreliable for re-encode uploads
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return false;
  return true;
}

function validateFile(file) {
  const typed = ensureTypedFile(file);
  if (!typed.type.startsWith("image/") && !typed.type.startsWith("video/")) {
    return { valid: false, error: "File must be an image or video" };
  }
  // Allow larger raw video uploads; they get compressed client-side first.
  if (typed.type.startsWith("video/") && typed.size > 100 * 1024 * 1024) {
    return { valid: false, error: "Video must be under 100MB before compression" };
  }
  return { valid: true, file: typed };
}

function generatePreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function addFile(file) {
  if (!props.multiple && fileList.value.length > 0) {
    const existing = fileList.value[0];
    if (existing.preview && existing.preview.startsWith("blob:")) {
      URL.revokeObjectURL(existing.preview);
    }
    fileList.value = [];
  }

  const validation = validateFile(file);
  if (!validation.valid) {
    fileList.value.push(
      reactive({
        id: generateFileId(),
        name: file.name,
        size: file.size,
        file,
        status: "error",
        errorMessage: validation.error,
        preview: null,
      }),
    );
    updateModelValue();
    return;
  }

  file = validation.file || ensureTypedFile(file);

  const fileObj = reactive({
    id: generateFileId(),
    name: file.name,
    size: file.size,
    file,
    status: "compressing",
    progress: 0,
    preview: null,
  });

  fileList.value.push(fileObj);
  fileObj.preview = await generatePreview(file);

  try {
    if (file.type.startsWith("video/")) {
      if (!canCompressVideoInBrowser()) {
        // Upload original with a guaranteed video MIME type (esp. iOS)
        const ready = ensureTypedFile(file, "video/mp4");
        fileObj.file = ready;
        fileObj.size = ready.size;
        fileObj.name = ready.name;
        fileObj.status = "pending";
        fileObj.progress = 100;
        emit("file-added", fileObj);
        updateModelValue();
        return;
      }

      const maxSizeMB = props.maxVideoSize / (1024 * 1024);
      const compressedBlob = await compressVideoToBlob(file, {
        maxSizeMB,
        onProgress: (p) => {
          fileObj.progress = Math.round(p * 100);
        },
      });
      const mime =
        compressedBlob.type && compressedBlob.type !== "application/octet-stream"
          ? compressedBlob.type
          : "video/webm";
      const ext = videoExtensionForMime(mime);
      const newName = file.name.replace(/\.[^/.]+$/, "") + ext;
      const compressedFile = new File([compressedBlob], newName, {
        type: mime,
        lastModified: Date.now(),
      });

      if (fileObj.preview && fileObj.preview.startsWith("blob:")) {
        URL.revokeObjectURL(fileObj.preview);
      }
      fileObj.file = compressedFile;
      fileObj.size = compressedFile.size;
      fileObj.name = newName;
      fileObj.preview = URL.createObjectURL(compressedFile);
      fileObj.status = "pending";
      fileObj.progress = 100;
      emit("file-added", fileObj);
      updateModelValue();
      return;
    }

    const maxSizeMB = props.maxSize / (1024 * 1024);
    const compressedBlob = await compressImageToBlob(file, maxSizeMB);
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    const compressedFile = new File([compressedBlob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    fileObj.file = compressedFile;
    fileObj.size = compressedFile.size;
    fileObj.name = newName;
    fileObj.status = "pending";
    emit("file-added", fileObj);
    updateModelValue();
  } catch (error) {
    console.error("Media compression failed:", error);
    const limit = file.type.startsWith("video/")
      ? props.maxVideoSize
      : props.maxSize;
    if (file.size <= limit) {
      const ready = ensureTypedFile(
        file,
        file.type.startsWith("video/") ? "video/mp4" : "image/jpeg",
      );
      fileObj.status = "pending";
      fileObj.file = ready;
      fileObj.size = ready.size;
      fileObj.name = ready.name;
      emit("file-added", fileObj);
      updateModelValue();
    } else {
      fileObj.status = "error";
      fileObj.errorMessage = "Compression failed";
      updateModelValue();
    }
  }
}

function removeFile(index) {
  const file = fileList.value[index];
  if (file.preview && file.preview.startsWith("blob:")) {
    URL.revokeObjectURL(file.preview);
  }
  fileList.value.splice(index, 1);
  emit("file-removed", file);
  updateModelValue();
}

function removeExistingImage(index) {
  emit("existing-removed", props.existingImages[index], index);
}

function updateModelValue() {
  if (props.multiple) {
    const files = fileList.value
      .filter((f) => f.status !== "error" && f.status !== "compressing")
      .map((f) => f.file);
    emit("update:modelValue", files.length > 0 ? files : null);
  } else {
    const file = fileList.value.find(
      (f) => f.status !== "error" && f.status !== "compressing",
    );
    emit("update:modelValue", file ? file.file : null);
  }
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  if (!props.multiple) {
    fileList.value.forEach((f) => {
      if (f.preview && f.preview.startsWith("blob:")) {
        URL.revokeObjectURL(f.preview);
      }
    });
    fileList.value = [];
    await addFile(files[0]);
  } else {
    if (fileList.value.length + files.length > props.maxFiles) {
      alert(`Maximum ${props.maxFiles} files allowed`);
      return;
    }
    for (const file of files) await addFile(file);
  }

  if (fileInput.value) fileInput.value.value = "";
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleDragEnter(e) {
  e.preventDefault();
  isDragOver.value = true;
}

function handleDragOver(e) {
  e.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(e) {
  e.preventDefault();
  if (!uploadZone.value?.contains(e.relatedTarget)) {
    isDragOver.value = false;
  }
}

async function handleDrop(e) {
  e.preventDefault();
  isDragOver.value = false;
  const files = Array.from(e.dataTransfer.files || []);
  if (files.length === 0) return;

  if (!props.multiple) {
    fileList.value.forEach((f) => {
      if (f.preview && f.preview.startsWith("blob:")) {
        URL.revokeObjectURL(f.preview);
      }
    });
    fileList.value = [];
    await addFile(files[0]);
  } else {
    if (fileList.value.length + files.length > props.maxFiles) {
      alert(`Maximum ${props.maxFiles} files allowed`);
      return;
    }
    for (const file of files) await addFile(file);
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue && fileList.value.length > 0) {
      fileList.value.forEach((f) => {
        if (f.preview && f.preview.startsWith("blob:")) {
          URL.revokeObjectURL(f.preview);
        }
      });
      fileList.value = [];
    }
  },
);

onUnmounted(() => {
  fileList.value.forEach((f) => {
    if (f.preview && f.preview.startsWith("blob:")) {
      URL.revokeObjectURL(f.preview);
    }
  });
});
</script>

<template>
  <div class="w-full min-w-0 space-y-3">
    <div
      v-if="showExisting && existingImages?.length"
      class="space-y-2"
    >
      <div class="text-xs font-medium text-neutral-500">Existing media</div>
      <div
        v-for="(image, index) in existingImages"
        :key="`existing-${index}`"
        class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3"
      >
        <button
          v-if="getImageUrl(image) && isVideoUrl(getImageUrl(image))"
          type="button"
          class="shrink-0"
        >
          <video
            :src="getImageUrl(image)"
            muted
            class="h-12 w-12 rounded-md border border-neutral-200 bg-black object-cover"
          />
        </button>
        <button
          v-else-if="getImageUrl(image)"
          type="button"
          class="shrink-0"
          @click.stop="previewImageUrl = getImageUrl(image)"
        >
          <img
            :src="getImageUrl(image)"
            alt="Existing"
            class="h-12 w-12 rounded-md border border-neutral-200 object-cover transition-opacity hover:opacity-80"
          />
        </button>
        <ImageIcon v-else class="h-8 w-8 text-neutral-300" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium">Existing image {{ index + 1 }}</div>
          <div class="text-xs text-neutral-500">Saved</div>
        </div>
        <Button
          variant="secondary"
          size="icon-sm"
          @click="removeExistingImage(index)"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div
      ref="uploadZone"
      :class="
        cn(
          'relative cursor-pointer rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition-colors',
          isDragOver && 'border-neutral-900 bg-neutral-100',
          fileList.length > 0 && 'p-4',
        )
      "
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="fileList.length === 0" class="space-y-2">
        <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
          <Upload class="h-5 w-5 text-neutral-600" />
        </div>
        <div class="text-sm font-medium text-neutral-900">
          {{ t("dragDropBrowse") }}
        </div>
        <div class="text-xs text-neutral-500">
          {{ hint || t("selectImage") }}
        </div>
      </div>
      <div v-else class="space-y-1">
        <div class="text-sm font-medium text-neutral-900">
          {{ fileList.length }} {{ t("fileSelected") }}
        </div>
        <div class="text-xs text-neutral-500">{{ t("clickToChange") }}</div>
      </div>
    </div>

    <div v-if="fileList.length > 0" class="w-full min-w-0 space-y-2">
      <div
        v-for="(file, index) in fileList"
        :key="file.id"
        class="flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-lg border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center"
      >
        <div
          class="flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 sm:w-auto sm:shrink-0"
        >
          <video
            v-if="file.preview && isVideoFile(file)"
            :src="file.preview"
            controls
            playsinline
            class="max-h-40 max-w-full bg-black object-contain"
          />
          <button
            v-else-if="file.preview"
            type="button"
            class="block max-w-full"
            @click.stop="previewImageUrl = file.preview"
          >
            <img
              :src="file.preview"
              alt="Preview"
              class="max-h-40 max-w-full object-contain transition-opacity hover:opacity-80"
            />
          </button>
          <ImageIcon v-else class="m-4 h-8 w-8 text-neutral-300" />
        </div>
        <div class="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium" :title="file.name">
              {{ file.name }}
            </div>
            <div class="text-xs text-neutral-500">
              {{ formatFileSize(file.size) }}
            </div>
            <div
              v-if="file.status === 'compressing'"
              class="mt-1 text-xs text-neutral-500"
            >
              Compressing{{ file.progress ? ` ${file.progress}%` : "…" }}
            </div>
            <div
              v-if="file.status === 'error'"
              class="mt-1 text-xs text-red-600"
            >
              {{ file.errorMessage }}
            </div>
          </div>
          <CheckCircle2
            v-if="file.status === 'complete' || file.status === 'pending'"
            class="h-5 w-5 shrink-0 text-emerald-600"
          />
          <Button
            variant="secondary"
            size="icon-sm"
            class="shrink-0"
            @click.stop="removeFile(index)"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="previewImageUrl"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      @click.self="previewImageUrl = null"
    >
      <button
        type="button"
        class="absolute top-4 right-4 rounded-lg bg-white/90 p-2 text-neutral-900 hover:bg-white"
        @click="previewImageUrl = null"
      >
        <X class="h-5 w-5" />
      </button>
      <img
        :src="previewImageUrl"
        alt=""
        class="max-h-[90vh] max-w-full rounded-lg object-contain shadow-lg"
      />
    </div>
  </Teleport>
</template>
