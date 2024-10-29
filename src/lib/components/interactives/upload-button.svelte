<script lang="ts">
	import fileState from '$lib/state/file.svelte';

	let fileInput: HTMLInputElement | null = null;
	let dragOver = $state(false);

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		dragOver = true;
	};

	const handleDragLeave = () => {
		dragOver = false;
	};

	const handleDrop = async (e: DragEvent) => {
		e.preventDefault();
		dragOver = false;

		if (!e.dataTransfer?.files) return;

		try {
			handleFiles(e.dataTransfer.files);
		} catch (error) {
			console.error('Failed to upload files:', error);
		}
	};

	const handleFiles = (files: FileList) => {
		//todo: sanitize file input better before reaching this stage
		Array.from(files).forEach(async (file) => {
			if (!file.type.startsWith('image/')) return;
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.src = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		});

		if (fileInput) {
			fileState.upload(files);
		}
	};
</script>

<input
	type="file"
	accept="image/*"
	multiple
	hidden
	bind:this={fileInput}
	onchange={(e) => handleFiles((e.target as HTMLInputElement).files!)}
/>

<button
	class="btn flex text-primary"
	class:bg-base-300={dragOver}
	onclick={() => fileInput?.click()}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<span> Upload </span>
	<span class="h-5 w-5">
		<iconify-icon icon="line-md:uploading-loop" height="1.25rem" width="1.25rem"></iconify-icon>
	</span>
</button>
