<script>
	import { fly } from 'svelte/transition';
	import Greet from './greet.svelte';
	import Button from '../primitives/button.svelte';

	let mounted = $state(false);

	$effect(() => {
		if (mounted) return;
		mounted = true;
	});
</script>

<div class="navbar bg-neutral/60 backdrop-blur-sm">
	<div class="navbar-start">
		{#if mounted}
			<div
				class="flex h-12 min-h-12 rounded-lg bg-base-200 p-3"
				in:fly={{ y: -100, duration: 500 }}
			>
				<img
					src="/logo.png"
					class="h-full w-auto rounded-lg bg-base-200 object-contain"
					alt="opentxpacker"
				/>
			</div>
		{/if}
	</div>

	<div class="navbar-end gap-4">
		<Button className="bigger-button bg-transparent ">
			<span class="h-4 w-4">
				<iconify-icon icon="line-md:folder-arrow-up-filled"></iconify-icon>
			</span>
			<span class="hidden sm:inline">Open Project</span>
			<span class="sm:hidden">Open</span>
		</Button>
		<Button className="bigger-button bg-transparent">
			<span class="h-4 w-4">
				<iconify-icon icon="line-md:cloud-alt-download-filled"></iconify-icon>
			</span>
			<span class="hidden sm:inline">Save Project</span>
			<span class="sm:hidden">Save</span>
		</Button>
	</div>
	<!-- <a href="/docs" class="btn btn-primary btn-sm brightness-[0.9]">Documentation</a> -->
</div>
