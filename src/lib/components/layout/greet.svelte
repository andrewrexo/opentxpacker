<script>
	import ButtonItem from '../button-item.svelte';
</script>

<ButtonItem caret className="bigger-button">
	<span class="h-5 w-5">
		<iconify-icon icon="line-md:folder-arrow-up-filled"></iconify-icon>
	</span>
	Open Project
</ButtonItem>
<ButtonItem caret className="bigger-button">
	<span class="h-5 w-5">
		<iconify-icon icon="line-md:cloud-alt-download-filled"></iconify-icon>
	</span>
	Save Project
</ButtonItem>

<style lang="postcss">
	iconify-icon {
		@apply text-lg;
	}
</style>
