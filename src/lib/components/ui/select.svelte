<script lang="ts">
	let selected = $state('');

	let {
		options = [],
		value = $bindable(''),
		label = '',
		placeholder = 'Select option'
	}: {
		options: string[];
		value: string;
		label: string;
		placeholder?: string;
	} = $props();

	$effect(() => {
		selected = value;
	});

	function handleSelect(option: string) {
		selected = option;
		value = option;
	}
</script>

<div class="dropdown dropdown-bottom w-full">
	{#if label}
		<label class="label px-0" for={label}>
			<span class="label-text text-sm font-bold">{label}</span>
		</label>
	{/if}

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<label
		for={label}
		tabindex="0"
		class="relative flex h-10 w-full cursor-pointer items-center rounded-lg bg-base-200 px-4 text-left hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary"
	>
		<span class="block flex-1 truncate">
			{selected || placeholder}
		</span>
		<span class="pointer-events-none flex items-center">
			<iconify-icon icon="heroicons:chevron-down-20-solid" class="h-5 w-5 text-base-content/70"
			></iconify-icon>
		</span>
	</label>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		tabindex="0"
		class="dropdown-content z-10 mt-1 max-h-60 min-w-full overflow-auto rounded-md bg-base-200 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
	>
		{#each options as option}
			<button
				type="button"
				onclick={() => handleSelect(option)}
				class="relative w-full cursor-pointer select-none px-4 py-2 text-left hover:bg-base-300 {selected ===
				option
					? 'bg-primary/10 text-primary'
					: ''}"
			>
				<span class="block truncate">
					{option}
				</span>
				{#if selected === option}
					<span class="absolute inset-y-0 right-0 flex h-5 w-5 items-center pr-3 text-primary">
						<iconify-icon icon="heroicons:check-20-solid"></iconify-icon>
					</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	iconify-icon {
		font-size: 1.25rem;
	}
</style>
