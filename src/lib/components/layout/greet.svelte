<script>
	import Button from '../ui/button.svelte';
</script>

<Button caret className="bigger-button">
	<span class="h-5 w-5">
		<iconify-icon icon="line-md:folder-arrow-up-filled"></iconify-icon>
	</span>
	Open Project
</Button>
<Button caret className="bigger-button">
	<span class="h-5 w-5">
		<iconify-icon icon="line-md:cloud-alt-download-filled"></iconify-icon>
	</span>
	Save Project
</Button>

<style lang="postcss">
	iconify-icon {
		@apply text-lg;
	}
</style>
