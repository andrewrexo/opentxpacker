<script lang="ts">
	import { browser } from '$app/environment';
	import type { Component } from 'svelte';

	let Phaser: Component | null = $state(null);

	$effect(() => {
		if (browser) {
			import('./root.svelte').then((module) => {
				Phaser = module.default;
			});
		}
	});
</script>

{#if browser && Phaser}
	<Phaser />
{/if}
