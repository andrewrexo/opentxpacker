interface AssetData {
	name: string;
	url: string;
}

interface UploadResult {
	name: string;
	success: boolean;
	error?: string;
}

interface ProjectData {
	version: string;
	atlasWidth: number;
	atlasHeight: number;
	assets: Array<{
		name: string;
		dataUrl: string;
		x: number;
		y: number;
		width: number;
		height: number;
	}>;
}

type EventMap = {
	loadNewAssets: (assets: AssetData[]) => void;
	uploadResult: (result: UploadResult) => void;
	adjustZoom: (value: number) => void;
	hoverTextureFileTree: (textureName: string | null) => void;
	hoverTextureCanvas: (textureName: string | null) => void;
	exportAtlas: (options: { format: string; textureFormat: string }) => void;
	saveProject: () => void;
	projectData: (data: ProjectData) => void;
	loadProject: (data: ProjectData) => void;
	requestManifest: () => void;
	manifestData: (json: string) => void;
	resizeAtlas: (size: { width: number; height: number }) => void;
	setPadding: (padding: number) => void;
	removeSprite: (name: string) => void;
	setTrimEnabled: (enabled: boolean) => void;
	setAlgorithm: (algorithm: string) => void;
	setHeuristic: (heuristic: string) => void;
	autoSizeAtlas: () => void;
	atlasSizeChanged: (size: string) => void;
	selectSprite: (name: string) => void;
};

type EventTypes = keyof EventMap;
type EventCallback<T extends EventTypes> = EventMap[T];

class EventBus {
	private events: Map<EventTypes, EventCallback<EventTypes>[]> = new Map();

	on<T extends EventTypes>(event: T, callback: EventCallback<T>) {
		if (!this.events.has(event)) {
			this.events.set(event, []);
		}
		this.events.get(event)?.push(callback as EventCallback<EventTypes>);
	}

	emit<T extends EventTypes>(event: T, ...args: Parameters<EventCallback<T>>) {
		this.events
			.get(event)
			?.forEach((callback) =>
				(callback as (...args: Parameters<EventCallback<T>>) => void)(...args)
			);
	}

	off<T extends EventTypes>(event: T, callback: EventCallback<T>) {
		const callbacks = this.events.get(event);
		if (callbacks) {
			const index = callbacks.indexOf(callback as EventCallback<EventTypes>);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		}
	}
}

export default new EventBus();
