<script lang="ts">
	import fileState from '$lib/state/file.svelte';
	import EventBus from '$lib/phaser/event-bus';

	let loadedTextures = $state(new Set<string>());
	let hoveredFile: string | null = $state(null);
	let selectedFile: string | null = $state(null);
	let assetListEl: HTMLUListElement;

	const handleUploadResult = (result: { name: string; success: boolean }) => {
		if (result.success) {
			loadedTextures = new Set([...loadedTextures, result.name]);
		}
	};

	const handleMouseEnter = (name: string) => {
		EventBus.emit('hoverTextureFileTree', name);
	};

	const handleMouseLeave = () => {
		EventBus.emit('hoverTextureFileTree', null);
	};

	const handleManifestClick = () => {
		EventBus.emit('requestManifest');
	};

	const handleRemoveAsset = (name: string) => {
		fileState.removeAsset(name);
		loadedTextures = new Set([...loadedTextures].filter((t) => t !== name));
		EventBus.emit('removeSprite', name);
	};

	EventBus.on('uploadResult', handleUploadResult);
	EventBus.on('hoverTextureCanvas', (name: string | null) => {
		hoveredFile = name;
	});
	EventBus.on('selectSprite', (name: string) => {
		selectedFile = name;
		// Auto-scroll to the selected item
		requestAnimationFrame(() => {
			if (assetListEl) {
				const el = assetListEl.querySelector(`[data-asset="${CSS.escape(name)}"]`);
				el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		});
		// Clear selection after a few seconds
		setTimeout(() => {
			if (selectedFile === name) selectedFile = null;
		}, 3000);
	});

	EventBus.on('manifestData', (json: string) => {
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'asset-manifest.json';
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	});
</script>

<div class="flex min-w-0 flex-col">
	<ul class="menu menu-sm w-full flex-1 overflow-hidden rounded-lg bg-base-200">
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
				<ul class="menu-content max-h-[calc(100vh-33rem)] overflow-y-auto" bind:this={assetListEl}>
					{#each fileState.assets as asset}
						<li
							data-asset={asset.name}
							class="group hover:bg-neutral-focus text-right hover:rounded-lg transition-colors duration-200"
							class:highlighted={hoveredFile === asset.name}
							class:selected={selectedFile === asset.name}
							onmouseenter={() => handleMouseEnter(asset.name)}
							onmouseleave={() => handleMouseLeave()}
						>
							<a
								aria-label={asset.name}
								class="flex min-w-0 items-center justify-between"
								class:opacity-50={!loadedTextures.has(asset.name)}
								class:text-error={fileState.failed.has(asset.name)}
							>
								<span class="flex min-w-0 items-center gap-1">
									<iconify-icon
										icon="material-symbols:image-outline"
										width="1rem"
										height="1rem"
										class="h-4 w-4"
									/>
									<span class="truncate">
										{asset.name}
										{#if !loadedTextures.has(asset.name)}
											<span class="text-xs">
												{fileState.failed.has(asset.name) ? '(failed)' : '(loading...)'}
											</span>
										{/if}
									</span>
								</span>
								<button
									class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
									onclick={(e) => { e.stopPropagation(); handleRemoveAsset(asset.name); }}
									aria-label="Remove {asset.name}"
								>
									<iconify-icon icon="mdi:close" width="0.875rem" height="0.875rem" />
								</button>
							</a>
						</li>
					{/each}
				</ul>
			</details>
		</li>
		<li>
			<a
				role="button"
				tabindex="0"
				onclick={handleManifestClick}
				onkeydown={(e) => e.key === 'Enter' && handleManifestClick()}
				class="cursor-pointer"
			>
				<iconify-icon icon="si:json-duotone" width="1rem" height="1rem" class="h-4 w-4" />
				asset-manifest.json
			</a>
		</li>
	</ul>
</div>

<style>
	.menu :where(li ul)::before {
		top: 0.5rem;
		bottom: 0.5rem;
	}

	.highlighted {
		@apply rounded-lg bg-neutral-content bg-opacity-10;
	}

	.selected {
		@apply rounded-lg bg-primary bg-opacity-20 ring-1 ring-primary;
	}
</style>
