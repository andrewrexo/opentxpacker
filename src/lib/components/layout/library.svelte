<script>
	import FileTree from '../file-tree.svelte';
</script>

{#snippet PanelHeader()}
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<h1 class="panel-header">Library</h1>
			<button
				class="bigger-button btn btn-neutral btn-sm transition-all hover:translate-y-[-1px]"
				aria-label="Project Settings"
			>
				<span class="h-5">
					<iconify-icon icon="line-md:uploading-loop" height="1.25rem" width="1.25rem"
					></iconify-icon>
				</span>
				Upload
			</button>
		</div>
		<p class="text-sm text-base-content/70">
			Your library is the home for all of your uploaded assets.
		</p>
	</div>
{/snippet}

<div class="flex flex-col gap-1">
	{@render PanelHeader()}
	<div class="divider my-1"></div>
	<FileTree />
</div>
