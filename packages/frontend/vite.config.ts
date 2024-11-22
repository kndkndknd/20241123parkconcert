import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        client: path.resolve(__dirname, "index.html"),
      },
      output: {
        dir: path.resolve(__dirname, "..", "backend", "static"),
        entryFileNames: "[name].js",
      },
    },
    sourcemap: true,
  },
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(
        // path.join(__dirname, "../../..", "keys/chat/privkey.pem")
        path.join(__dirname, "../../..", "keys/chat/private.key")
      ),
      cert: fs.readFileSync(
        path.join(__dirname, "../../..", "keys/chat/selfsigned.crt")
        // path.join(__dirname, "../../..", "keys/chat/fullchain.pem")
      ),
      passphrase: "chat",
    },
    port: 8088,
  },
});
