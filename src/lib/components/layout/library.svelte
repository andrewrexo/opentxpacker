<script>
	import { fade } from 'svelte/transition';
	import FileTree from '../file-tree.svelte';
	import UploadButton from '../interactives/upload-button.svelte';

	let mounted = $state(false);

	$effect(() => {
		if (mounted) return;
		mounted = true;
	});
</script>

{#snippet PanelHeader()}
	<div class="flex h-full flex-col gap-1">
		<h2 class="text-lg font-bold">Library</h2>
		<span class="pb-4 text-xs text-base-content/50">
			You'll find all of your project's assets here. Select an asset from the file tree to show it's
			position in the canvas.
		</span>
		<UploadButton />
	</div>
{/snippet}

{#if mounted}
	<div class="flex flex-col gap-4 pb-2" in:fade={{ duration: 500 }}>
		{@render PanelHeader()}
		<FileTree />
	</div>
{/if}
