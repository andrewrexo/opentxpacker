<script>
	import ButtonItem from '../button-item.svelte';
</script>

<div class="flex flex-col gap-2">
	<ButtonItem caret>
		<span class="h-5 w-5">
			<iconify-icon icon="line-md:folder-arrow-up-filled"></iconify-icon>
		</span>
		Open Project
	</ButtonItem>
	<ButtonItem caret>
		<span class="h-5 w-5">
			<iconify-icon icon="line-md:cloud-alt-download-filled"></iconify-icon>
		</span>
		Save Project
	</ButtonItem>
</div>

<style lang="postcss">
	iconify-icon {
		@apply text-lg;
	}
</style>
