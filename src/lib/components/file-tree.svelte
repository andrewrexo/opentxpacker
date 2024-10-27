<script lang="ts">
	let assets = $state(['image.png', 'image2.png', 'image3.png']);
</script>

<!-- svelte-ignore a11y_missing_attribute -->
<ul class="menu menu-xs w-full max-w-xs rounded-lg bg-base-200">
	<li>
		<details open>
			<summary>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-4 w-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
					/>
				</svg>
				assets
			</summary>
			<ul class="menu-content">
				{#each assets as asset}
					<li class="text-right">
						<a>
							<iconify-icon
								icon="material-symbols:image-outline"
								width="1rem"
								height="1rem"
								class="h-4 w-4"
							></iconify-icon>
							{asset}
						</a>
					</li>
				{/each}
			</ul>
		</details>
	</li>
	<li>
		<a>
			<iconify-icon icon="si:json-duotone" width="1rem" height="1rem" class="h-4 w-4"
			></iconify-icon>
			asset-manifest.json
		</a>
	</li>
</ul>

<style>
	.menu :where(li ul)::before {
		top: 0.5rem;
		bottom: 0.5rem;
	}
</style>
