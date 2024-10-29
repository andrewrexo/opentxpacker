<script lang="ts">
	import Canvas from '$lib/components/layout/canvas.svelte';
	import Greet from '$lib/components/layout/greet.svelte';
	import Library from '$lib/components/layout/library.svelte';
	import Settings from '$lib/components/layout/settings.svelte';
	import { fly } from 'svelte/transition';

	let mounted = $state(false);

	$effect(() => {
		if (mounted) return;
		mounted = true;
	});
</script>

<div class="flex h-screen max-h-[100vh] bg-base-200">
	<div class="flex h-full w-64 min-w-64 flex-col gap-2 border-r border-base-300 bg-base-100 p-4">
		{#if mounted}
			<div in:fly={{ y: -100, duration: 500 }}>
				<div class="min-h-10 px-1 py-2">
					<img
						src="/logo.png"
						class="h-full w-full rounded-lg object-contain pb-1"
						alt="opentxpacker"
					/>
				</div>
				<div class="divider my-0"></div>
			</div>
		{/if}
		<Library />
		<div class="mb-4 mt-auto flex flex-col gap-4">
			<Greet />
		</div>
	</div>

	<div class="w-full">
		<Canvas />
	</div>

	<div class="w-64 min-w-64 border-l border-base-300 bg-base-100 p-4">
		<Settings />
	</div>
</div>
