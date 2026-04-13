<script lang="ts">
	import Button from '../primitives/button.svelte';
	import eventBus from '$lib/phaser/event-bus';
	import fileState from '$lib/state/file.svelte';

	let fileInput: HTMLInputElement;

	const handleSaveProject = () => {
		eventBus.emit('saveProject');
	};

	const handleOpenProject = () => {
		fileInput.click();
	};

	const handleFileSelected = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = JSON.parse(text);

			if (!data.version || !data.assets || !Array.isArray(data.assets)) {
				throw new Error('Invalid project file format');
			}

			// Reset file state assets for the file tree
			fileState.clearAssets();

			// Add assets to file state so they appear in the file tree
			for (const asset of data.assets) {
				fileState.addAsset({ name: asset.name, url: asset.dataUrl });
			}

			eventBus.emit('loadProject', data);
		} catch (err) {
			console.error('Failed to open project:', err);
			alert('Failed to open project file. Please ensure it is a valid .otxp file.');
		}

		// Reset input so the same file can be re-selected
		input.value = '';
	};

	// Listen for project data to trigger the download
	eventBus.on('projectData', (data) => {
		const json = JSON.stringify(data);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'project.otxp';
		link.click();

		link.remove();
		URL.revokeObjectURL(url);
	});
</script>

<input
	type="file"
	accept=".otxp"
	class="hidden"
	bind:this={fileInput}
	onchange={handleFileSelected}
/>

<Button caret className="bigger-button" onclick={handleOpenProject}>
	<span class="h-5 w-5">
		<iconify-icon icon="line-md:folder-arrow-up-filled"></iconify-icon>
	</span>
	Open Project
</Button>
<Button caret className="bigger-button" onclick={handleSaveProject}>
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
