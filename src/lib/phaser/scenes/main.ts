import { Scene } from 'phaser';
import EventBus from '../event-bus';
import {
	createPacker,
	MaxRectsPacker,
	BasicShelfPacker,
	type PackingAlgorithm,
	type MaxRectsHeuristic,
	type Rectangle
} from '../packing';

interface AtlasPage {
	packer: MaxRectsPacker | BasicShelfPacker;
	boundary: Phaser.GameObjects.Rectangle;
	label: Phaser.GameObjects.Text;
	offsetX: number;
}

const PAGE_GAP = 40; // px gap between pages in the scene

export default class MainScene extends Scene {
	private sprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
	private spritePages: Map<string, number> = new Map(); // sprite name -> page index
	private logo!: Phaser.GameObjects.Image;
	private resizeTimer: number | null = null;
	private atlasWidth = 1024; // Default atlas size
	private atlasHeight = 1024;
	private cameraSpeed = 10;
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private centerPoint!: Phaser.Math.Vector2;
	private currentHighlight?: Phaser.GameObjects.Rectangle;
	private pages: AtlasPage[] = [];
	private padding = 0;
	private trimEnabled = false;
	private trimData: Map<string, { offsetX: number; offsetY: number; origWidth: number; origHeight: number }> = new Map();
	private originalImages: Map<string, HTMLImageElement> = new Map();
	private packAlgorithm: PackingAlgorithm = 'MaxRects';
	private packHeuristic: MaxRectsHeuristic = 'BestShortSideFit';
	private isDragging = false;
	private dragPrevX = 0;
	private dragPrevY = 0;

	constructor() {
		super({ key: 'main' });
	}

	create() {
		this.cameras.main.fadeIn(500, 32, 37, 46);

		this.centerPoint = new Phaser.Math.Vector2(this.atlasWidth / 2, this.atlasHeight / 2);

		this.logo = this.add.image(this.atlasWidth / 2, this.atlasHeight / 2, 'logo').setAlpha(0.5);

		this.addPage();

		if (this.input.keyboard) {
			this.cursors = this.input.keyboard.createCursorKeys();
		}

		this.game.scale.on('resize', this.handleResize, this);
		this.resize();

		// Middle-click drag to pan
		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			if (pointer.middleButtonDown()) {
				this.isDragging = true;
				this.dragPrevX = pointer.x;
				this.dragPrevY = pointer.y;
				this.game.canvas.style.cursor = 'grabbing';
			}
		});

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			if (this.isDragging) {
				const zoom = this.cameras.main.zoom;
				const dx = (this.dragPrevX - pointer.x) / zoom;
				const dy = (this.dragPrevY - pointer.y) / zoom;
				this.cameras.main.scrollX += dx;
				this.cameras.main.scrollY += dy;
				this.dragPrevX = pointer.x;
				this.dragPrevY = pointer.y;
			}
		});

		this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
			if (this.isDragging && !pointer.middleButtonDown()) {
				this.isDragging = false;
				this.game.canvas.style.cursor = 'default';
			}
		});

		EventBus.on('adjustZoom', (value) => {
			this.cameras.main.setZoom(value / 100);
		});

		// Listen for new assets to load
		EventBus.on('loadNewAssets', (assets) => {
			assets.forEach(({ name, url }) => {
				if (!this.textures.exists(name)) {
					const image = new Image();

					image.onload = () => {
						if (this.textures) {
							try {
								// Store original for re-trimming later
								this.originalImages.set(name, image);

								let textureSource: HTMLImageElement | HTMLCanvasElement = image;

								if (this.trimEnabled) {
									const trimResult = this.trimImage(image);
									if (trimResult) {
										textureSource = trimResult.image;
										this.trimData.set(name, {
											offsetX: trimResult.offsetX,
											offsetY: trimResult.offsetY,
											origWidth: trimResult.origWidth,
											origHeight: trimResult.origHeight
										});
									}
								}

								if (textureSource instanceof HTMLCanvasElement) {
									this.textures.addCanvas(name, textureSource);
								} else {
									this.textures.addImage(name, textureSource);
								}
								URL.revokeObjectURL(url);

								const texWidth = textureSource.width;
								const texHeight = textureSource.height;

								const position = this.findPositionMultiPage(texWidth, texHeight);
								if (!position) {
									EventBus.emit('uploadResult', {
										name,
										success: false,
										error: 'Sprite too large for atlas page'
									});
									return;
								}

								this.spritePages.set(name, position.pageIndex);

								if (this.sprites.size === 0) {
									this.logo.setVisible(false);
								}

								const sprite = this.add.sprite(position.x, position.y, name);
								sprite.setOrigin(0, 0);
								sprite.setInteractive();

								sprite.on('pointerover', () => {
									this.highlightSprite(name);
									this.game.canvas.style.cursor = 'pointer';
									EventBus.emit('hoverTextureCanvas', name);
								});

								sprite.on('pointerout', () => {
									this.clearHighlight();
									this.game.canvas.style.cursor = 'default';
									EventBus.emit('hoverTextureCanvas', null);
								});

								sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
									if (pointer.leftButtonDown()) {
										EventBus.emit('selectSprite', name);
									}
								});

								this.sprites.set(name, sprite);

								EventBus.emit('uploadResult', { name, success: true });
							} catch (error) {
								EventBus.emit('uploadResult', {
									name,
									success: false,
									error: error instanceof Error ? error.message : 'Unknown error'
								});
							}
						}
					};

					image.onerror = () => {
						EventBus.emit('uploadResult', {
							name,
							success: false,
							error: 'Failed to load image'
						});
					};

					image.src = url;
				}
			});
		});

		EventBus.on('hoverTextureFileTree', (name: string | null) => {
			if (name) {
				const sprite = this.sprites.get(name);
				if (sprite) {
					this.currentHighlight?.destroy();
					this.currentHighlight = this.add.rectangle(
						sprite.x,
						sprite.y,
						sprite.width,
						sprite.height,
						0x00ff00,
						0.3
					);
					this.currentHighlight.setOrigin(0, 0);
					this.currentHighlight.setStrokeStyle(2, 0x00ff00);
				}
			} else {
				this.currentHighlight?.destroy();
				this.currentHighlight = undefined;
			}
		});

		EventBus.on('exportAtlas', (options) => {
			console.log('exporting atlas', options);
			this.exportAtlas({ ...options });
		});

		EventBus.on('saveProject', () => {
			this.saveProject();
		});

		EventBus.on('requestManifest', () => {
			const metadata = this.getAtlasMetadata('Phaser 3', 'png');
			EventBus.emit('manifestData', JSON.stringify(metadata, null, 2));
		});

		EventBus.on('loadProject', (data) => {
			this.loadProjectData(data);
		});

		EventBus.on('resizeAtlas', ({ width, height }) => {
			this.resizeAtlasTo(width, height);
		});

		EventBus.on('setPadding', (padding) => {
			this.padding = padding;
			this.repackAllSprites();
		});

		EventBus.on('setTrimEnabled', (enabled) => {
			this.trimEnabled = enabled;
			this.trimData.clear();
			this.retextureAndRepack();
		});

		EventBus.on('setAlgorithm', (algorithm) => {
			this.packAlgorithm = algorithm as PackingAlgorithm;
			this.repackAllSprites();
		});

		EventBus.on('setHeuristic', (heuristic) => {
			this.packHeuristic = heuristic as MaxRectsHeuristic;
			this.repackAllSprites();
		});

		EventBus.on('autoSizeAtlas', () => {
			this.autoSizeAtlas();
		});

		EventBus.on('removeSprite', (name) => {
			const sprite = this.sprites.get(name);
			if (sprite) {
				sprite.destroy();
				this.sprites.delete(name);
				this.spritePages.delete(name);
				this.originalImages.delete(name);
				this.trimData.delete(name);
				if (this.textures.exists(name)) {
					this.textures.remove(name);
				}

				if (this.sprites.size === 0) {
					this.logo.setVisible(true);
				}

				// Re-pack remaining sprites to reclaim space
				this.repackAllSprites();
			}
		});
	}

	private addPage(): AtlasPage {
		const pageIndex = this.pages.length;
		const offsetX = pageIndex * (this.atlasWidth + PAGE_GAP);

		const packer = createPacker({
			algorithm: this.packAlgorithm,
			heuristic: this.packHeuristic,
			width: this.atlasWidth,
			height: this.atlasHeight,
			padding: this.padding
		});

		const boundary = this.add.rectangle(offsetX, 0, this.atlasWidth, this.atlasHeight, 0x666666, 0.2);
		boundary.setStrokeStyle(4, 0x666666, 0.5);
		boundary.setOrigin(0, 0);

		const label = this.add.text(offsetX + 4, -20, `Page ${pageIndex + 1}`, {
			fontSize: '14px',
			color: '#999999'
		});

		const page: AtlasPage = { packer, boundary, label, offsetX };
		this.pages.push(page);
		return page;
	}

	private clearAllPages() {
		for (const page of this.pages) {
			page.boundary.destroy();
			page.label.destroy();
		}
		this.pages = [];
		this.spritePages.clear();
	}

	/**
	 * Find a position across all pages, creating a new page if needed.
	 */
	private findPositionMultiPage(width: number, height: number): { x: number; y: number; pageIndex: number } | null {
		// Try existing pages first
		for (let i = 0; i < this.pages.length; i++) {
			const result = this.pages[i].packer.findPosition(width, height);
			if (result) {
				return {
					x: result.x + this.pages[i].offsetX,
					y: result.y,
					pageIndex: i
				};
			}
		}

		// No space — create a new page
		const newPage = this.addPage();
		const result = newPage.packer.findPosition(width, height);
		if (result) {
			return {
				x: result.x + newPage.offsetX,
				y: result.y,
				pageIndex: this.pages.length - 1
			};
		}

		return null; // Sprite too large for a single page
	}

	private autoSizeAtlas() {
		// Collect all sprite dimensions
		const sizes: Array<{ width: number; height: number }> = [];
		this.sprites.forEach((sprite) => {
			sizes.push({ width: sprite.width, height: sprite.height });
		});

		if (sizes.length === 0) return;

		// Try power-of-2 sizes from 64 up to 8192
		const pot = [64, 128, 256, 512, 1024, 2048, 4096, 8192];

		for (const size of pot) {
			if (this.tryPackAll(sizes, size, size)) {
				this.atlasWidth = size;
				this.atlasHeight = size;
				this.centerLogo();
				this.clearAllPages();
				this.addPage();
				this.repackAllSprites();
				this.resize();
				EventBus.emit('atlasSizeChanged', `${size}x${size}`);
				return;
			}
		}

		// If nothing worked, use max size (multi-page will handle overflow)
		const max = pot[pot.length - 1];
		this.atlasWidth = max;
		this.atlasHeight = max;
		this.centerLogo();
		this.clearAllPages();
		this.addPage();
		this.repackAllSprites();
		this.resize();
		EventBus.emit('atlasSizeChanged', `${max}x${max}`);
	}

	/**
	 * Test whether all sprites fit in a given atlas size without
	 * modifying the actual scene state.
	 */
	private tryPackAll(
		sizes: Array<{ width: number; height: number }>,
		width: number,
		height: number
	): boolean {
		const testPacker = createPacker({
			algorithm: this.packAlgorithm,
			heuristic: this.packHeuristic,
			width,
			height,
			padding: this.padding
		});

		// Sort largest-area first for more reliable packing test
		const sorted = [...sizes].sort((a, b) => b.width * b.height - a.width * a.height);

		for (const size of sorted) {
			const result = testPacker.findPosition(size.width, size.height);
			if (!result) return false;
		}

		return true;
	}

	private resizeAtlasTo(width: number, height: number) {
		this.atlasWidth = width;
		this.atlasHeight = height;
		this.centerLogo();
		this.clearAllPages();
		this.addPage();
		this.repackAllSprites();
		this.resize();
	}

	private centerLogo() {
		this.logo.setPosition(this.atlasWidth / 2, this.atlasHeight / 2);
	}

	private retextureAndRepack() {
		// Re-create textures with or without trimming, then re-pack
		const spriteNames = [...this.sprites.keys()];

		// Destroy existing sprites and textures
		this.sprites.forEach((sprite) => sprite.destroy());
		this.sprites.clear();
		this.clearHighlight();
		this.clearAllPages();
		this.addPage();

		if (spriteNames.length > 0) {
			this.logo.setVisible(false);
		}

		for (const name of spriteNames) {
			const origImage = this.originalImages.get(name);
			if (!origImage) continue;

			let textureSource: HTMLImageElement | HTMLCanvasElement = origImage;

			// Remove old texture
			if (this.textures.exists(name)) {
				this.textures.remove(name);
			}

			if (this.trimEnabled) {
				const trimResult = this.trimImage(origImage);
				if (trimResult) {
					textureSource = trimResult.image;
					this.trimData.set(name, {
						offsetX: trimResult.offsetX,
						offsetY: trimResult.offsetY,
						origWidth: trimResult.origWidth,
						origHeight: trimResult.origHeight
					});
				}
			}

			if (textureSource instanceof HTMLCanvasElement) {
				this.textures.addCanvas(name, textureSource);
			} else {
				this.textures.addImage(name, textureSource);
			}

			const texWidth = textureSource.width;
			const texHeight = textureSource.height;

			const position = this.findPositionMultiPage(texWidth, texHeight);
			if (!position) {
				EventBus.emit('uploadResult', {
					name,
					success: false,
					error: 'Sprite too large for atlas page'
				});
				continue;
			}

			this.spritePages.set(name, position.pageIndex);

			const sprite = this.add.sprite(position.x, position.y, name);
			sprite.setOrigin(0, 0);
			sprite.setInteractive();

			sprite.on('pointerover', () => {
				this.highlightSprite(name);
				this.game.canvas.style.cursor = 'pointer';
				EventBus.emit('hoverTextureCanvas', name);
			});

			sprite.on('pointerout', () => {
				this.clearHighlight();
				this.game.canvas.style.cursor = 'default';
				EventBus.emit('hoverTextureCanvas', null);
			});

			this.sprites.set(name, sprite);
		}

		this.centerPoint.set(this.getTotalWidth() / 2, this.atlasHeight / 2);
		this.resize();
	}

	private repackAllSprites() {
		this.clearAllPages();
		this.addPage();

		const spritesToRepack = new Map(this.sprites);
		this.sprites.forEach((sprite) => sprite.destroy());
		this.sprites.clear();
		this.clearHighlight();

		if (spritesToRepack.size > 0) {
			this.logo.setVisible(false);
		}

		spritesToRepack.forEach((oldSprite, name) => {
			const position = this.findPositionMultiPage(oldSprite.width, oldSprite.height);
			if (!position) {
				EventBus.emit('uploadResult', {
					name,
					success: false,
					error: 'Sprite too large for atlas page'
				});
				return;
			}

			this.spritePages.set(name, position.pageIndex);

			const sprite = this.add.sprite(position.x, position.y, name);
			sprite.setOrigin(0, 0);
			sprite.setInteractive();

			sprite.on('pointerover', () => {
				this.highlightSprite(name);
				this.game.canvas.style.cursor = 'pointer';
				EventBus.emit('hoverTextureCanvas', name);
			});

			sprite.on('pointerout', () => {
				this.clearHighlight();
				this.game.canvas.style.cursor = 'default';
				EventBus.emit('hoverTextureCanvas', null);
			});

			this.sprites.set(name, sprite);
		});

		this.centerPoint.set(this.getTotalWidth() / 2, this.atlasHeight / 2);
		this.resize();
	}

	private handleResize = () => {
		if (this.resizeTimer) {
			clearTimeout(this.resizeTimer);
		}
		this.resizeTimer = window.setTimeout(() => {
			this.resize();
			this.resizeTimer = null;
		}, 100) as unknown as number;
	};

	private calculateOptimalZoom(containerWidth: number, containerHeight: number): number {
		const totalWidth = this.getTotalWidth();
		const zoomX = containerWidth / totalWidth;
		const zoomY = containerHeight / this.atlasHeight;
		const idealZoom = Math.min(zoomX, zoomY);

		const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
		const optimalZoom = zoomLevels.reverse().find((zoom) => zoom <= idealZoom) ?? 0.1;

		EventBus.emit('adjustZoom', optimalZoom * 100);

		return optimalZoom;
	}

	async exportAtlas(options: { format: string; textureFormat: string }) {
		const { format, textureFormat } = options;
		const fileType = textureFormat === 'WebP' ? 'webp' : 'png';
		const pageCount = this.pages.length;

		const downloadLink = document.createElement('a');

		for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
			const page = this.pages[pageIdx];

			const offscreenCanvas = document.createElement('canvas');
			offscreenCanvas.width = this.atlasWidth;
			offscreenCanvas.height = this.atlasHeight;
			const offscreenCtx = offscreenCanvas.getContext('2d')!;

			// Draw only sprites belonging to this page
			this.sprites.forEach((sprite, name) => {
				if (this.spritePages.get(name) !== pageIdx) return;

				const texture = sprite.texture;
				const frame = sprite.frame;
				// Sprite x is in scene coordinates, subtract page offset for canvas coords
				offscreenCtx.drawImage(
					texture.getSourceImage() as HTMLImageElement,
					frame.x,
					frame.y,
					frame.width,
					frame.height,
					sprite.x - page.offsetX,
					sprite.y,
					sprite.width,
					sprite.height
				);
			});

			let dataUrl: string;
			if (textureFormat === 'PNG-8') {
				dataUrl = this.quantizeTo8Bit(offscreenCanvas, offscreenCtx);
			} else if (textureFormat === 'WebP') {
				dataUrl = offscreenCanvas.toDataURL('image/webp', 0.9);
			} else {
				dataUrl = offscreenCanvas.toDataURL('image/png');
			}

			// Download image
			const suffix = pageCount > 1 ? `-${pageIdx}` : '';
			const imageBlob = await (await fetch(dataUrl)).blob();
			const imageFile = new File([imageBlob], `atlas${suffix}.${fileType}`, {
				type: `image/${fileType}`
			});
			const imageUrl = URL.createObjectURL(imageFile);
			downloadLink.href = imageUrl;
			downloadLink.download = imageFile.name;
			downloadLink.click();
			URL.revokeObjectURL(imageUrl);
		}

		// Download metadata
		const metadata = this.getAtlasMetadata(format, fileType);
		const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
			type: 'application/json'
		});
		const jsonFile = new File([jsonBlob], 'atlas.json', {
			type: 'application/json'
		});
		const jsonUrl = URL.createObjectURL(jsonFile);
		downloadLink.href = jsonUrl;
		downloadLink.download = jsonFile.name;
		downloadLink.click();

		downloadLink.remove();
		URL.revokeObjectURL(jsonUrl);
	}

	/**
	 * Quantize a 32-bit RGBA canvas down to 256 colors using median-cut,
	 * then render the result back to produce a PNG with a reduced palette.
	 */
	private quantizeTo8Bit(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const pixels = imageData.data;

		// Collect unique non-transparent pixels as [r, g, b, a]
		const colorPixels: number[][] = [];
		for (let i = 0; i < pixels.length; i += 4) {
			if (pixels[i + 3] > 0) {
				colorPixels.push([pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]);
			}
		}

		// Median-cut quantization to 256 colors
		const palette = this.medianCut(colorPixels, 256);

		// Map each pixel to the nearest palette color
		for (let i = 0; i < pixels.length; i += 4) {
			if (pixels[i + 3] === 0) continue;

			let bestDist = Infinity;
			let bestColor = palette[0];

			for (const color of palette) {
				const dr = pixels[i] - color[0];
				const dg = pixels[i + 1] - color[1];
				const db = pixels[i + 2] - color[2];
				const dist = dr * dr + dg * dg + db * db;
				if (dist < bestDist) {
					bestDist = dist;
					bestColor = color;
				}
			}

			pixels[i] = bestColor[0];
			pixels[i + 1] = bestColor[1];
			pixels[i + 2] = bestColor[2];
			// Preserve original alpha
		}

		ctx.putImageData(imageData, 0, 0);
		return canvas.toDataURL('image/png');
	}

	private medianCut(pixels: number[][], maxColors: number): number[][] {
		if (pixels.length === 0) return [[0, 0, 0, 255]];
		if (pixels.length <= maxColors) {
			return pixels;
		}

		type Bucket = number[][];
		const buckets: Bucket[] = [pixels];

		while (buckets.length < maxColors) {
			// Find the bucket with the widest channel range
			let bestBucketIdx = 0;
			let bestRange = -1;
			let bestChannel = 0;

			for (let b = 0; b < buckets.length; b++) {
				const bucket = buckets[b];
				if (bucket.length < 2) continue;

				for (let ch = 0; ch < 3; ch++) {
					let min = 255, max = 0;
					for (const px of bucket) {
						if (px[ch] < min) min = px[ch];
						if (px[ch] > max) max = px[ch];
					}
					const range = max - min;
					if (range > bestRange) {
						bestRange = range;
						bestBucketIdx = b;
						bestChannel = ch;
					}
				}
			}

			if (bestRange <= 0) break;

			const bucket = buckets[bestBucketIdx];
			bucket.sort((a, b) => a[bestChannel] - b[bestChannel]);
			const mid = Math.floor(bucket.length / 2);

			buckets[bestBucketIdx] = bucket.slice(0, mid);
			buckets.push(bucket.slice(mid));
		}

		// Average each bucket to get the palette color
		return buckets.map((bucket) => {
			if (bucket.length === 0) return [0, 0, 0, 255];
			let r = 0, g = 0, b = 0;
			for (const px of bucket) {
				r += px[0];
				g += px[1];
				b += px[2];
			}
			const len = bucket.length;
			return [Math.round(r / len), Math.round(g / len), Math.round(b / len), 255];
		});
	}

	private getAtlasMetadata(format: string, fileType: string) {
		const pageCount = this.pages.length;
		const suffix = (i: number) => pageCount > 1 ? `-${i}` : '';

		if (format === 'Multiatlas') {
			return this.getMultiatlasMetadata(fileType, suffix);
		} else if (format === 'JSON') {
			return this.getGenericJsonMetadata(fileType, suffix);
		}

		return this.getPhaser3Metadata(fileType, suffix);
	}

	/** Get the page-local x for a sprite (subtract page offset). */
	private spriteLocalX(name: string, sprite: Phaser.GameObjects.Sprite): number {
		const pageIdx = this.spritePages.get(name) ?? 0;
		const page = this.pages[pageIdx];
		return sprite.x - (page?.offsetX ?? 0);
	}

	private getPhaser3Metadata(fileType: string, suffix: (i: number) => string) {
		// For single page, standard format. For multi-page, wrap in pages array.
		const pageCount = this.pages.length;

		if (pageCount <= 1) {
			const frames: Record<string, object> = {};
			this.sprites.forEach((sprite, name) => {
				const trim = this.trimData.get(name);
				const trimmed = !!trim;
				frames[name] = {
					frame: { x: this.spriteLocalX(name, sprite), y: sprite.y, w: sprite.width, h: sprite.height },
					rotated: false,
					trimmed,
					spriteSourceSize: { x: trim?.offsetX ?? 0, y: trim?.offsetY ?? 0, w: sprite.width, h: sprite.height },
					sourceSize: { w: trim?.origWidth ?? sprite.width, h: trim?.origHeight ?? sprite.height }
				};
			});
			return {
				frames,
				meta: {
					app: 'OpenTXPacker',
					version: '1.0',
					image: `atlas.${fileType}`,
					format: 'RGBA8888',
					size: { w: this.atlasWidth, h: this.atlasHeight },
					scale: 1
				}
			};
		}

		// Multi-page: return an array of atlas objects
		const atlases = [];
		for (let p = 0; p < pageCount; p++) {
			const frames: Record<string, object> = {};
			this.sprites.forEach((sprite, name) => {
				if (this.spritePages.get(name) !== p) return;
				const trim = this.trimData.get(name);
				const trimmed = !!trim;
				frames[name] = {
					frame: { x: this.spriteLocalX(name, sprite), y: sprite.y, w: sprite.width, h: sprite.height },
					rotated: false,
					trimmed,
					spriteSourceSize: { x: trim?.offsetX ?? 0, y: trim?.offsetY ?? 0, w: sprite.width, h: sprite.height },
					sourceSize: { w: trim?.origWidth ?? sprite.width, h: trim?.origHeight ?? sprite.height }
				};
			});
			atlases.push({
				frames,
				meta: {
					app: 'OpenTXPacker',
					version: '1.0',
					image: `atlas${suffix(p)}.${fileType}`,
					format: 'RGBA8888',
					size: { w: this.atlasWidth, h: this.atlasHeight },
					scale: 1
				}
			});
		}
		return atlases;
	}

	private getMultiatlasMetadata(fileType: string, suffix: (i: number) => string) {
		const textures = [];

		for (let p = 0; p < this.pages.length; p++) {
			const frames: Array<object> = [];

			this.sprites.forEach((sprite, name) => {
				if (this.spritePages.get(name) !== p) return;
				const trim = this.trimData.get(name);
				const trimmed = !!trim;

				frames.push({
					filename: name,
					frame: { x: this.spriteLocalX(name, sprite), y: sprite.y, w: sprite.width, h: sprite.height },
					rotated: false,
					trimmed,
					sourceSize: { w: trim?.origWidth ?? sprite.width, h: trim?.origHeight ?? sprite.height },
					spriteSourceSize: { x: trim?.offsetX ?? 0, y: trim?.offsetY ?? 0, w: sprite.width, h: sprite.height }
				});
			});

			textures.push({
				image: `atlas${suffix(p)}.${fileType}`,
				format: 'RGBA8888',
				size: { w: this.atlasWidth, h: this.atlasHeight },
				scale: 1,
				frames
			});
		}

		return {
			textures,
			meta: {
				app: 'OpenTXPacker',
				version: '1.0'
			}
		};
	}

	private getGenericJsonMetadata(fileType: string, suffix: (i: number) => string) {
		const pages = [];

		for (let p = 0; p < this.pages.length; p++) {
			const frames: Array<object> = [];

			this.sprites.forEach((sprite, name) => {
				if (this.spritePages.get(name) !== p) return;
				frames.push({
					name,
					x: this.spriteLocalX(name, sprite),
					y: sprite.y,
					width: sprite.width,
					height: sprite.height
				});
			});

			pages.push({
				image: `atlas${suffix(p)}.${fileType}`,
				width: this.atlasWidth,
				height: this.atlasHeight,
				frames
			});
		}

		// Single page: return flat structure for backwards compat
		if (pages.length === 1) return pages[0];
		return { pages };
	}

	private getTotalWidth(): number {
		if (this.pages.length <= 1) return this.atlasWidth;
		return this.pages.length * this.atlasWidth + (this.pages.length - 1) * PAGE_GAP;
	}

	resize() {
		const { width, height } = this.scale;

		const zoom = this.calculateOptimalZoom(width, height);
		this.cameras.main.setZoom(zoom);

		// Center the camera on the middle of the atlas
		const totalWidth = this.getTotalWidth();
		this.cameras.main.centerOn(totalWidth / 2, this.atlasHeight / 2);
	}

	update() {
		if (!this.cursors) return;

		if (this.cursors.left.isDown) {
			this.cameras.main.scrollX -= this.cameraSpeed;
		}
		if (this.cursors.right.isDown) {
			this.cameras.main.scrollX += this.cameraSpeed;
		}
		if (this.cursors.up.isDown) {
			this.cameras.main.scrollY -= this.cameraSpeed;
		}
		if (this.cursors.down.isDown) {
			this.cameras.main.scrollY += this.cameraSpeed;
		}
	}

	private saveProject() {
		const assets: Array<{
			name: string;
			dataUrl: string;
			x: number;
			y: number;
			width: number;
			height: number;
		}> = [];

		this.sprites.forEach((sprite, name) => {
			const canvas = document.createElement('canvas');
			canvas.width = sprite.width;
			canvas.height = sprite.height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(
					sprite.texture.getSourceImage() as HTMLImageElement,
					0,
					0,
					sprite.width,
					sprite.height
				);
				assets.push({
					name,
					dataUrl: canvas.toDataURL('image/png'),
					x: sprite.x,
					y: sprite.y,
					width: sprite.width,
					height: sprite.height
				});
			}
		});

		EventBus.emit('projectData', {
			version: '1.0',
			atlasWidth: this.atlasWidth,
			atlasHeight: this.atlasHeight,
			assets
		});
	}

	private async loadProjectData(data: {
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
	}) {
		// Clear existing sprites
		this.sprites.forEach((sprite) => sprite.destroy());
		this.sprites.clear();
		this.clearHighlight();

		// Reset atlas dimensions
		this.atlasWidth = data.atlasWidth;
		this.atlasHeight = data.atlasHeight;
		this.clearAllPages();
		this.addPage();

		// Recenter camera
		this.centerPoint.set(this.getTotalWidth() / 2, this.atlasHeight / 2);
		this.resize();

		// Load each asset
		for (const asset of data.assets) {
			await new Promise<void>((resolve) => {
				const image = new Image();
				image.onload = () => {
					if (this.textures.exists(asset.name)) {
						this.textures.remove(asset.name);
					}
					this.textures.addImage(asset.name, image);

					// Mark the space as used in the first page's packer
					this.pages[0]?.packer.markUsed({
						x: asset.x,
						y: asset.y,
						width: asset.width,
						height: asset.height
					});

					if (this.sprites.size === 0) {
						this.logo.setVisible(false);
					}

					const sprite = this.add.sprite(asset.x, asset.y, asset.name);
					sprite.setOrigin(0, 0);
					sprite.setInteractive();

					sprite.on('pointerover', () => {
						this.highlightSprite(asset.name);
						this.game.canvas.style.cursor = 'pointer';
						EventBus.emit('hoverTextureCanvas', asset.name);
					});

					sprite.on('pointerout', () => {
						this.clearHighlight();
						this.game.canvas.style.cursor = 'default';
						EventBus.emit('hoverTextureCanvas', null);
					});

					this.sprites.set(asset.name, sprite);
					EventBus.emit('uploadResult', { name: asset.name, success: true });
					resolve();
				};
				image.onerror = () => {
					EventBus.emit('uploadResult', {
						name: asset.name,
						success: false,
						error: 'Failed to load image from project file'
					});
					resolve();
				};
				image.src = asset.dataUrl;
			});
		}
	}

	private trimImage(image: HTMLImageElement): { image: HTMLImageElement | HTMLCanvasElement; offsetX: number; offsetY: number; origWidth: number; origHeight: number } | null {
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;

		ctx.drawImage(image, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const { data, width, height } = imageData;

		let minX = width, minY = height, maxX = 0, maxY = 0;
		let hasPixels = false;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const alpha = data[(y * width + x) * 4 + 3];
				if (alpha > 0) {
					hasPixels = true;
					if (x < minX) minX = x;
					if (x > maxX) maxX = x;
					if (y < minY) minY = y;
					if (y > maxY) maxY = y;
				}
			}
		}

		if (!hasPixels) return null;

		const trimWidth = maxX - minX + 1;
		const trimHeight = maxY - minY + 1;

		// If no trimming needed, return original
		if (minX === 0 && minY === 0 && trimWidth === width && trimHeight === height) {
			return { image, offsetX: 0, offsetY: 0, origWidth: width, origHeight: height };
		}

		const trimCanvas = document.createElement('canvas');
		trimCanvas.width = trimWidth;
		trimCanvas.height = trimHeight;
		const trimCtx = trimCanvas.getContext('2d');
		if (!trimCtx) return null;

		trimCtx.drawImage(canvas, minX, minY, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);

		return {
			image: trimCanvas,
			offsetX: minX,
			offsetY: minY,
			origWidth: width,
			origHeight: height
		};
	}

	private highlightSprite(name: string) {
		const sprite = this.sprites.get(name);
		if (sprite) {
			this.currentHighlight?.destroy();
			this.currentHighlight = this.add.rectangle(
				sprite.x,
				sprite.y,
				sprite.width,
				sprite.height,
				0x00ff00,
				0.3
			);
			this.currentHighlight.setOrigin(0, 0);
			this.currentHighlight.setStrokeStyle(2, 0x00ff00);
		}
	}

	private clearHighlight() {
		this.currentHighlight?.destroy();
		this.currentHighlight = undefined;
	}
}
