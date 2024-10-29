<script lang="ts">
	import eventBus from '$lib/phaser/event-bus';

	let zoom = $state(50);

	const zoomIn = () => {
		if (zoom + 25 > 200) return;
		zoom = zoom + 25;
		eventBus.emit('adjustZoom', zoom);
	};

	const zoomOut = () => {
		if (zoom - 25 < 25) return;
		zoom = zoom - 25;
		eventBus.emit('adjustZoom', zoom);
	};

	eventBus.on('adjustZoom', (value: number) => {
		zoom = value;
	});
</script>

<div class="z-10 flex items-center gap-2 rounded-full bg-base-200 p-2">
	<button class="btn btn-circle btn-sm" onclick={zoomOut}>-</button>
	<input
		type="range"
		class="range range-sm w-32"
		min="25"
		max="200"
		step="25"
		bind:value={zoom}
		onchange={() => {
			eventBus.emit('adjustZoom', zoom);
		}}
	/>
	<button class="btn btn-circle btn-sm" onclick={zoomIn}>+</button>
	<span class="text-sm">{zoom}%</span>
</div>
