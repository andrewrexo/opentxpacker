const createFileState = () => {
	let assets: string[] = $state([]);

	return {
		get assets() {
			return assets;
		},
		upload(files: FileList) {
			assets = [...assets, ...Array.from(files).map((f) => f.name)];
		}
	};
};

const fileState = createFileState();

export default fileState;
