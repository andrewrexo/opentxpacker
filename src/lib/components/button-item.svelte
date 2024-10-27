<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ButtonItemProps {
		children: Snippet;
		caret?: boolean;
		className?: string;
	}

	let { children, caret = true, className }: ButtonItemProps = $props();

	let isHovered = $state(false);

	const onMouseEnter = () => {
		isHovered = true;
	};

	const onMouseLeave = () => {
		isHovered = false;
	};
</script>

<div class="flex items-center gap-2">
	<button
		class="btn btn-neutral btn-sm flex-1 flex-row-reverse justify-between transition-transform hover:translate-x-[1px] {className}"
		onmouseenter={onMouseEnter}
		onmouseleave={onMouseLeave}
	>
		{@render children()}
		{#if caret}
			<label for="swap-icon" class="swap {isHovered ? 'swap-active' : ''}">
				<iconify-icon icon="eva:diagonal-arrow-right-up-fill" class="swap-on"></iconify-icon>
				<iconify-icon icon="ph:caret-right-bold" class="swap-off"></iconify-icon>
			</label>
		{/if}
	</button>
</div>
