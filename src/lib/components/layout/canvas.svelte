<script>
	let zoom = $state(100);
</script>

<div class="relative h-full rounded-lg bg-base-300">
	<div class="absolute bottom-4 left-4 flex items-center gap-2">
		<button class="btn btn-circle btn-sm">-</button>
		<input type="range" class="range range-sm w-32" min="10" max="200" bind:value={zoom} />
		<button class="btn btn-circle btn-sm">+</button>
		<span class="text-sm">{zoom}%</span>
	</div>
</div>
