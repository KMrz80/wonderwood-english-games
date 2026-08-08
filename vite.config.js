import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/wonderwood-english-games/',
  server: {
    watch: {
      ignored: ['**/responsive-check/**']
    }
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        forestDelivery: resolve(import.meta.dirname, 'forest-delivery.html'),
        fixTheMachine: resolve(import.meta.dirname, 'fix-the-machine.html'),
        wheresMyToy: resolve(import.meta.dirname, 'wheres-my-toy.html')
      }
    }
  }
});
