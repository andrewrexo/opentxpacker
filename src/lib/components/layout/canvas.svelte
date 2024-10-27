<script>
	import PhaserWrapper from '../phaser/wrapper.svelte';
	import ZoomControl from '../zoom-control.svelte';
</script>

<div class="relative h-full w-full rounded-lg bg-base-300">
	<div class="grid-lines absolute inset-0"></div>
	<div class="h-full w-full">
		<PhaserWrapper />
	</div>
	<div class="absolute bottom-4 left-4 flex items-center gap-2">
		<ZoomControl />
	</div>
	<p class="absolute left-4 top-4 z-10 text-sm">interactable action text</p>
</div>
