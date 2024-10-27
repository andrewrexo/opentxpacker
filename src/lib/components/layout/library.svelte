<script>
	import FileTree from '../file-tree.svelte';
</script>

{#snippet PanelHeader()}
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<h1 class="panel-header">Library</h1>
			<button
				class="bigger-button btn btn-ghost btn-sm mt-1 text-primary transition-all hover:bg-neutral"
				aria-label="Project Settings"
			>
				<span class="h-4 w-4">
					<iconify-icon icon="line-md:uploading-loop" height="1rem" width="1rem"></iconify-icon>
				</span>
				Upload
			</button>
		</div>
		<p class="text-sm text-base-content/70">
			You'll find all of your uploaded textures here. Select a file to highlight it in the canvas.
		</p>
	</div>
{/snippet}

<div class="flex flex-col gap-4">
	{@render PanelHeader()}
	<FileTree />
</div>
