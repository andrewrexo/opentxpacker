<script>
	let zoom = $state(100);

	const zoomIn = () => {
		zoom = zoom + 10;
	};

	const zoomOut = () => {
		zoom = zoom - 10;
	};
</script>

<div class="z-10 flex items-center gap-2">
	<button class="btn btn-circle btn-sm" onclick={zoomOut}>-</button>
	<input type="range" class="range range-sm w-32" min="10" max="200" bind:value={zoom} />
	<button class="btn btn-circle btn-sm" onclick={zoomIn}>+</button>
	<span class="text-sm">{zoom}%</span>
</div>
