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

<div class="flex h-screen bg-base-200">
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
		<div class="mt-auto flex flex-col gap-4">
			<Greet />
		</div>
		<div class="divider my-1"></div>
		<div class="flex items-center justify-center gap-2 text-primary">
			<a
				aria-label="Twitter"
				href="https://x.com/drdreidelrx/"
				target="_blank"
				class="btn btn-circle flex items-center justify-center gap-2 hover:scale-105 hover:text-primary"
			>
				<iconify-icon icon="line-md:twitter-x" height="1.25rem" width="1.25rem"></iconify-icon>
			</a>
			<a
				aria-label="GitHub"
				href="https://github.com/andrewrexo"
				target="_blank"
				class="btn btn-circle flex items-center justify-center gap-2 hover:scale-105 hover:text-primary"
			>
				<iconify-icon icon="line-md:github" height="1.25rem" width="1.25rem"></iconify-icon>
			</a>
			<a
				aria-label="Portfolio"
				href="https://rubes.dev/"
				target="_blank"
				class="btn btn-circle flex items-center justify-center gap-2 hover:scale-105 hover:text-primary"
			>
				<iconify-icon icon="line-md:person" height="1.25rem" width="1.25rem"></iconify-icon>
			</a>
		</div>
	</div>

	<div class="w-full">
		<Canvas />
	</div>

	<div class="w-64 min-w-64 border-l border-base-300 bg-base-100 p-4">
		<Settings />
	</div>
</div>
