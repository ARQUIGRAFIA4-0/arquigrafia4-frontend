import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coversDir = path.resolve(__dirname, "public/collections");
const virtualModuleId = "virtual:collection-covers";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function readCollectionCoverPaths() {
  if (!fs.existsSync(coversDir)) {
    return [];
  }

  return fs
    .readdirSync(coversDir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort()
    .map((file) => `/collections/${file}`);
}

function collectionCoversPlugin() {
  return {
    name: "collection-covers",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export default ${JSON.stringify(readCollectionCoverPaths())};`;
      }
    },
    configureServer(server) {
      if (fs.existsSync(coversDir)) {
        server.watcher.add(coversDir);
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(coversDir)) {
        const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          return [mod];
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [vue(), vueJsx(), collectionCoversPlugin()],
  server: {
    port: 8080,
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});