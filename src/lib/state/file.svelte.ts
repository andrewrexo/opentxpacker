import eventBus from '$lib/phaser/event-bus';

const createFileState = () => {
	let assets: Array<{ name: string; url: string }> = $state([]);
	let failedUploads = $state(new Set<string>());

	const handleUploadResult = (result: { name: string; success: boolean; error?: string }) => {
		if (!result.success) {
			failedUploads.add(result.name);
			// Remove failed asset from assets array
			assets = assets.filter((asset) => asset.name !== result.name);
			console.error(`Failed to upload ${result.name}: ${result.error}`);
		}
	};

	eventBus.on('uploadResult', handleUploadResult);

	return {
		get assets() {
			return assets;
		},
		get failed() {
			return failedUploads;
		},
		async upload(files: FileList) {
			// Clear previous failed uploads
			failedUploads = new Set();

			const newAssets = await Promise.all(
				Array.from(files).map(async (file) => {
					const url = URL.createObjectURL(file);
					return { name: file.name, url };
				})
			);

			assets = [...assets, ...newAssets];

			// Emit event for Phaser to load these assets
			eventBus.emit('loadNewAssets', newAssets);
		}
	};
};

const fileState = createFileState();

export default fileState;
