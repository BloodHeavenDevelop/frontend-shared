<script setup lang="ts">
/**
 * The page canvas between header and footer (manifest § 3): the 40px gutters, the
 * 28px rhythm between sections and — on a phone — the room reserved for the tab bar.
 * Width and centring of the canvas are the application's (its `.hm-canvas` override
 * in `main.css`, see its DESIGN_SPECIFICATION.md).
 */
</script>

<template>
  <main class="hm-canvas">
    <slot />
  </main>
</template>
