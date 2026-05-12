<script setup>
import { computed } from "vue";
import { selectionToViewIcon, viewOptions } from "@/constants/viewModes";

defineOptions({ name: "CollectionToolbar" });

const props = defineProps({
    viewSelection: {
        type: String,
        default: "grid",
    },
    isInfoActive: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["view-change", "toggle-info", "download"]);

const viewOptionsList = computed(() => viewOptions());

const viewIconClass = computed(() => selectionToViewIcon(props.viewSelection));

// TODO: Implementar a lógica de seleção do modo de visualização
function onSelectView(option) {
    console.log("onSelectView", option);
    if (option.selection === props.viewSelection) return;

    emit("view-change", {
        selection: option.selection,
        mode: option.mode,
    });

}
</script>

<template>
    <div
      class="collection-toolbar d-flex align-items-center bg-white rounded-3"
      role="toolbar"
      aria-label="Barra de ações da coleção"
    >
        <!-- esquerda: modo de visualização -->
        <div class="dropdown dropup">
            <button
                id="collection-view-mode-dropdown"
                class="btn btn-icon dropdown-toggle caret-right"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
            <i :class="['bi', viewIconClass]" />
            </button>
            <ul class="dropdown-menu menu-dark mt-3">
                <li v-for="option in viewOptionsList" :key="option.selection">
                    <button
                        class="dropdown-item"
                        :class="{ active: viewSelection === option.selection }"
                        @click="onSelectView(option)"
                    >
                    <i :class="['bi', selectionToViewIcon(option.selection), 'me-2']" />
                    {{ option.label }}
                    </button>
                </li>
            </ul>
        </div>
  
        <span class="collection-toolbar__divider" aria-hidden="true" />
  
        <!-- direita: informações + download -->
        <button
            type="button"
            class="btn btn-icon collection-toolbar__action"
            :class="{ active: isInfoActive }"
            :aria-pressed="isInfoActive"
            aria-label="Informações da coleção"
            title="Informações da coleção"
            @click="emit('toggle-info')"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g clip-path="url(#clip0_8306_8344)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22.5C14.7848 22.5 17.4555 21.3938 19.4246 19.4246C21.3938 17.4555 22.5 14.7848 22.5 12C22.5 9.21523 21.3938 6.54451 19.4246 4.57538C17.4555 2.60625 14.7848 1.5 12 1.5C9.21523 1.5 6.54451 2.60625 4.57538 4.57538C2.60625 6.54451 1.5 9.21523 1.5 12C1.5 14.7848 2.60625 17.4555 4.57538 19.4246C6.54451 21.3938 9.21523 22.5 12 22.5ZM12 24C15.1826 24 18.2348 22.7357 20.4853 20.4853C22.7357 18.2348 24 15.1826 24 12C24 8.8174 22.7357 5.76516 20.4853 3.51472C18.2348 1.26428 15.1826 0 12 0C8.8174 0 5.76516 1.26428 3.51472 3.51472C1.26428 5.76516 0 8.8174 0 12C0 15.1826 1.26428 18.2348 3.51472 20.4853C5.76516 22.7357 8.8174 24 12 24Z" fill="#FAF9F9"/>
                    <path d="M13.3949 9.88281L9.95993 10.3133L9.83693 10.8833L10.5119 11.0078C10.9529 11.1128 11.0399 11.2718 10.9439 11.7113L9.83693 16.9133C9.54593 18.2588 9.99443 18.8918 11.0489 18.8918C11.8664 18.8918 12.8159 18.5138 13.2464 17.9948L13.3784 17.3708C13.0784 17.6348 12.6404 17.7398 12.3494 17.7398C11.9369 17.7398 11.7869 17.4503 11.8934 16.9403L13.3949 9.88281Z" fill="#FAF9F9"/>
                    <path d="M12 8.25C12.8284 8.25 13.5 7.57843 13.5 6.75C13.5 5.92157 12.8284 5.25 12 5.25C11.1716 5.25 10.5 5.92157 10.5 6.75C10.5 7.57843 11.1716 8.25 12 8.25Z" fill="white"/>
                </g>
                <defs>
                    <clipPath id="clip0_8306_8344">
                    <rect width="24" height="24" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
        </button>
  
        <button
            type="button"
            class="btn btn-icon collection-toolbar__action"
            aria-label="Baixar coleção"
            title="Baixar coleção"
            style="background-color: #fff;"
            @click="emit('download')"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g clip-path="url(#clip0_8306_8349)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 0C10.0204 0.00620777 8.10822 0.720203 6.609 2.013C5.46 3.003 4.6275 4.293 4.413 5.5875C1.899 6.1425 0 8.3325 0 10.977C0 14.049 2.562 16.5 5.6715 16.5H11.25V8.25C11.25 8.05109 11.329 7.86032 11.4697 7.71967C11.6103 7.57902 11.8011 7.5 12 7.5C12.1989 7.5 12.3897 7.57902 12.5303 7.71967C12.671 7.86032 12.75 8.05109 12.75 8.25V16.5H19.032C21.753 16.5 24 14.355 24 11.6595C24 9.2055 22.137 7.206 19.749 6.8685C19.3845 2.9985 16.035 0 12 0ZM11.469 23.781C11.5387 23.8508 11.6214 23.9063 11.7125 23.9441C11.8037 23.9819 11.9013 24.0013 12 24.0013C12.0987 24.0013 12.1963 23.9819 12.2874 23.9441C12.3786 23.9063 12.4613 23.8508 12.531 23.781L17.031 19.281C17.1718 19.1402 17.2509 18.9492 17.2509 18.75C17.2509 18.5508 17.1718 18.3598 17.031 18.219C16.8902 18.0782 16.6992 17.9991 16.5 17.9991C16.3008 17.9991 16.1098 18.0782 15.969 18.219L12.75 21.4395V16.5H11.25V21.4395L8.031 18.219C7.89017 18.0782 7.69916 17.9991 7.5 17.9991C7.30084 17.9991 7.10983 18.0782 6.969 18.219C6.82817 18.3598 6.74905 18.5508 6.74905 18.75C6.74905 18.9492 6.82817 19.1402 6.969 19.281L11.469 23.781Z" fill="#2F2F2F"/>
                </g>
                <defs>
                    <clipPath id="clip0_8306_8349">
                    <rect width="24" height="24" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
        </button>
    </div>
</template>
  
<style scoped>
    .collection-toolbar {
        box-shadow: var(--shadow-elevation-medium, 0 8px 24px rgba(0, 0, 0, 0.15));
        padding: 12px;
        gap: 8px;
        width: fit-content;
        border: 1px solid rgba(0, 0, 0, 0.06);
    }

    .collection-toolbar__divider {
        display: inline-block;
        width: 1px;
        height: 24px;
        background-color: var(--cinza-400, rgba(0, 0, 0, 1));
        margin: 0 12px;
    }

    .collection-toolbar__action {
        width: 40px;
        height: 40px;
        min-width: 40px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--Cinza_E, #2f2f2f);
        background: var(--Cinza_C, #A6A6A6);        
    }

    .collection-toolbar__action.active {
        background-color: var(--Laranja_E);
        color: var(--Branco);
        border: none;
    }

    .collection-toolbar__action.active > .bi,
    .collection-toolbar__action.active > i[class^="bi"] {
        color: currentColor;
    }
</style>