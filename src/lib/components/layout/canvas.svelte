<script>
	let zoom = $state(100);
</script>

<div class="relative h-full rounded-lg bg-base-300">
	<div
		class="absolute inset-0 h-full w-full bg-base-300 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
	></div>
	<div class="absolute bottom-4 left-4 flex items-center gap-2">
		<button class="btn btn-circle btn-sm">-</button>
		<input type="range" class="range range-sm w-32" min="10" max="200" bind:value={zoom} />
		<button class="btn btn-circle btn-sm">+</button>
		<span class="text-sm">{zoom}%</span>
	</div>
</div>
