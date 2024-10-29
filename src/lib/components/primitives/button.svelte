<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
		children: Snippet;
		caret?: boolean;
		className?: string;
	}

	let { children, caret = false, className, ...rest }: ButtonProps = $props();

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
		class="btn flex-1 flex-row-reverse items-center justify-between transition-transform hover:text-primary {className}"
		onmouseenter={onMouseEnter}
		onmouseleave={onMouseLeave}
		{...rest}
	>
		{@render children()}
		{#if caret}
			<span class="h-4 w-4">
				<label for="swap-icon" class="swap {isHovered ? 'swap-active' : ''}">
					<iconify-icon
						icon="eva:diagonal-arrow-right-up-fill"
						class="swap-on"
						height="1rem"
						width="1rem"
					></iconify-icon>
					<iconify-icon icon="ph:caret-right-bold" class="swap-off" height="1rem" width="1rem"
					></iconify-icon>
				</label>
			</span>
		{/if}
	</button>
</div>

<style lang="postcss">
	.swap-on {
		@apply text-primary;
	}
</style>
