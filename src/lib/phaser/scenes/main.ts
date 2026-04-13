import { Scene } from 'phaser';
import EventBus from '../event-bus';

interface Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

export default class MainScene extends Scene {
	private sprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
	private logo!: Phaser.GameObjects.Image;
	private resizeTimer: number | null = null;
	private atlasWidth = 1024; // Default atlas size
	private atlasHeight = 1024;
	private freeRects: Rectangle[] = [];
	private cameraSpeed = 10;
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private centerPoint!: Phaser.Math.Vector2;
	private currentHighlight?: Phaser.GameObjects.Rectangle;
	private atlasBoundary?: Phaser.GameObjects.Rectangle;
	private padding = 0;
	private trimEnabled = false;
	private trimData: Map<string, { offsetX: number; offsetY: number; origWidth: number; origHeight: number }> = new Map();
	private originalImages: Map<string, HTMLImageElement> = new Map();

	constructor() {
		super({ key: 'main' });
	}

	create() {
		this.cameras.main.fadeIn(500, 32, 37, 46);

		this.centerPoint = new Phaser.Math.Vector2(this.atlasWidth / 2, this.atlasHeight / 2);
		this.cameras.main.startFollow(this.centerPoint, true);

		this.logo = this.add.image(this.atlasWidth / 2, this.atlasHeight / 2, 'logo').setAlpha(0.5);

		this.drawAtlasBoundary();
		this.initializeAtlas();

		if (this.input.keyboard) {
			this.cursors = this.input.keyboard.createCursorKeys();
		}

		this.game.scale.on('resize', this.handleResize, this);
		this.resize();

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

								const position = this.findPosition(texWidth, texHeight);
								if (!position) {
									EventBus.emit('uploadResult', {
										name,
										success: false,
										error: 'No space left in atlas'
									});
									return;
								}

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

		EventBus.on('removeSprite', (name) => {
			const sprite = this.sprites.get(name);
			if (sprite) {
				sprite.destroy();
				this.sprites.delete(name);
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

	private drawAtlasBoundary() {
		this.atlasBoundary = this.add.rectangle(0, 0, this.atlasWidth, this.atlasHeight, 0x666666, 0.2);
		this.atlasBoundary.setStrokeStyle(4, 0x666666, 0.5);
		this.atlasBoundary.setOrigin(0, 0);
	}

	private resizeAtlasTo(width: number, height: number) {
		this.atlasWidth = width;
		this.atlasHeight = height;
		this.atlasBoundary?.destroy();
		this.drawAtlasBoundary();
		this.repackAllSprites();
	}

	private retextureAndRepack() {
		// Re-create textures with or without trimming, then re-pack
		const spriteNames = [...this.sprites.keys()];

		// Destroy existing sprites and textures
		this.sprites.forEach((sprite) => sprite.destroy());
		this.sprites.clear();
		this.clearHighlight();
		this.initializeAtlas();

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

			const position = this.findPosition(texWidth, texHeight);
			if (!position) {
				EventBus.emit('uploadResult', {
					name,
					success: false,
					error: 'No space left in atlas'
				});
				continue;
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

			this.sprites.set(name, sprite);
		}

		this.centerPoint.set(this.atlasWidth / 2, this.atlasHeight / 2);
		this.resize();
	}

	private repackAllSprites() {
		this.initializeAtlas();

		const spritesToRepack = new Map(this.sprites);
		this.sprites.forEach((sprite) => sprite.destroy());
		this.sprites.clear();
		this.clearHighlight();

		if (spritesToRepack.size > 0) {
			this.logo.setVisible(false);
		}

		spritesToRepack.forEach((oldSprite, name) => {
			const position = this.findPosition(oldSprite.width, oldSprite.height);
			if (!position) {
				EventBus.emit('uploadResult', {
					name,
					success: false,
					error: 'No space left in atlas'
				});
				return;
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

			this.sprites.set(name, sprite);
		});

		this.centerPoint.set(this.atlasWidth / 2, this.atlasHeight / 2);
		this.resize();
	}

	private initializeAtlas() {
		this.freeRects = [
			{
				x: 0,
				y: 0,
				width: this.atlasWidth,
				height: this.atlasHeight
			}
		];
	}

	private findPosition(width: number, height: number): Rectangle | null {
		const paddedWidth = width + this.padding * 2;
		const paddedHeight = height + this.padding * 2;

		// Sort free rectangles by area to try smaller spaces first
		this.freeRects.sort((a, b) => a.width * a.height - b.width * b.height);

		for (const freeRect of this.freeRects) {
			if (freeRect.width >= paddedWidth && freeRect.height >= paddedHeight) {
				// Reserve the full padded area in the free rect tracker
				const paddedRect = {
					x: freeRect.x,
					y: freeRect.y,
					width: paddedWidth,
					height: paddedHeight
				};

				this.splitFreeRectangles(paddedRect);

				// Return the inner position (offset by padding)
				return {
					x: freeRect.x + this.padding,
					y: freeRect.y + this.padding,
					width,
					height
				};
			}
		}

		return null;
	}

	private splitFreeRectangles(usedRect: Rectangle) {
		const newFreeRects: Rectangle[] = [];

		for (let i = 0; i < this.freeRects.length; i++) {
			const freeRect = this.freeRects[i];
			if (this.isIntersecting(usedRect, freeRect)) {
				if (freeRect.x < usedRect.x + usedRect.width && freeRect.x + freeRect.width > usedRect.x) {
					// Space above
					if (freeRect.y < usedRect.y) {
						newFreeRects.push({
							x: freeRect.x,
							y: freeRect.y,
							width: freeRect.width,
							height: usedRect.y - freeRect.y
						});
					}
					// Space below
					if (freeRect.y + freeRect.height > usedRect.y + usedRect.height) {
						newFreeRects.push({
							x: freeRect.x,
							y: usedRect.y + usedRect.height,
							width: freeRect.width,
							height: freeRect.y + freeRect.height - (usedRect.y + usedRect.height)
						});
					}
				}

				if (
					freeRect.y < usedRect.y + usedRect.height &&
					freeRect.y + freeRect.height > usedRect.y
				) {
					// Space to the left
					if (freeRect.x < usedRect.x) {
						newFreeRects.push({
							x: freeRect.x,
							y: freeRect.y,
							width: usedRect.x - freeRect.x,
							height: freeRect.height
						});
					}
					// Space to the right
					if (freeRect.x + freeRect.width > usedRect.x + usedRect.width) {
						newFreeRects.push({
							x: usedRect.x + usedRect.width,
							y: freeRect.y,
							width: freeRect.x + freeRect.width - (usedRect.x + usedRect.width),
							height: freeRect.height
						});
					}
				}
			} else {
				newFreeRects.push(freeRect);
			}
		}

		// Remove any rectangles that are contained within others
		this.freeRects = this.mergeFreeRectangles(newFreeRects);
	}

	private mergeFreeRectangles(rects: Rectangle[]): Rectangle[] {
		const filtered = rects.filter((rect) => rect.width > 0 && rect.height > 0);

		for (let i = filtered.length - 1; i >= 0; i--) {
			for (let j = 0; j < filtered.length; j++) {
				if (i !== j && this.isContained(filtered[i], filtered[j])) {
					filtered.splice(i, 1);
					break;
				}
			}
		}

		return filtered;
	}

	private isContained(rect1: Rectangle, rect2: Rectangle): boolean {
		return (
			rect1.x >= rect2.x &&
			rect1.y >= rect2.y &&
			rect1.x + rect1.width <= rect2.x + rect2.width &&
			rect1.y + rect1.height <= rect2.y + rect2.height
		);
	}

	private isIntersecting(rect1: Rectangle, rect2: Rectangle): boolean {
		return !(
			rect1.x >= rect2.x + rect2.width ||
			rect1.x + rect1.width <= rect2.x ||
			rect1.y >= rect2.y + rect2.height ||
			rect1.y + rect1.height <= rect2.y
		);
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
		const zoomX = containerWidth / this.atlasWidth;
		const zoomY = containerHeight / this.atlasHeight;
		const idealZoom = Math.min(zoomX, zoomY);

		const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
		const optimalZoom = zoomLevels.reverse().find((zoom) => zoom <= idealZoom) ?? 0.25;

		EventBus.emit('adjustZoom', optimalZoom * 100);

		return optimalZoom;
	}

	private async handleSnapshot(snap: HTMLImageElement, fileType: string, format: string) {
		const dataUrl = snap.src;
		const metadata = this.getAtlasMetadata(format, fileType);

		const imageBlob = await (await fetch(dataUrl)).blob();
		const imageFile = new File([imageBlob], `atlas.${fileType}`, {
			type: `image/${fileType}`
		});
		const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
			type: 'application/json'
		});
		const jsonFile = new File([jsonBlob], 'atlas.json', {
			type: 'application/json'
		});

		const imageUrl = URL.createObjectURL(imageFile);
		const jsonUrl = URL.createObjectURL(jsonFile);

		const downloadLink = document.createElement('a');
		downloadLink.href = imageUrl;
		downloadLink.download = imageFile.name;
		downloadLink.click();

		downloadLink.href = jsonUrl;
		downloadLink.download = jsonFile.name;
		downloadLink.click();

		downloadLink.remove();
		URL.revokeObjectURL(imageUrl);
		URL.revokeObjectURL(jsonUrl);
	}

	async exportAtlas(options: { format: string; textureFormat: string }) {
		const { format, textureFormat } = options;

		const offscreenCanvas = document.createElement('canvas');
		offscreenCanvas.width = this.atlasWidth;
		offscreenCanvas.height = this.atlasHeight;
		const offscreenCtx = offscreenCanvas.getContext('2d')!;

		this.sprites.forEach((sprite) => {
			const texture = sprite.texture;
			const frame = sprite.frame;
			offscreenCtx.drawImage(
				texture.getSourceImage() as HTMLImageElement,
				frame.x,
				frame.y,
				frame.width,
				frame.height,
				sprite.x,
				sprite.y,
				sprite.width,
				sprite.height
			);
		});

		let fileType: string;
		let dataUrl: string;

		if (textureFormat === 'PNG-8') {
			fileType = 'png';
			dataUrl = this.quantizeTo8Bit(offscreenCanvas, offscreenCtx);
		} else if (textureFormat === 'WebP') {
			fileType = 'webp';
			dataUrl = offscreenCanvas.toDataURL('image/webp', 0.9);
		} else {
			// PNG-32 (default)
			fileType = 'png';
			dataUrl = offscreenCanvas.toDataURL('image/png');
		}

		const snap = new Image();
		snap.src = dataUrl;
		snap.onload = () => {
			this.handleSnapshot(snap, fileType, format);
		};
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
		const imageFilename = `atlas.${fileType}`;

		if (format === 'Multiatlas') {
			return this.getMultiatlasMetadata(imageFilename);
		} else if (format === 'JSON') {
			return this.getGenericJsonMetadata(imageFilename);
		}

		return this.getPhaser3Metadata(imageFilename);
	}

	private getPhaser3Metadata(imageFilename: string) {
		const frames: Record<
			string,
			{
				frame: { x: number; y: number; w: number; h: number };
				rotated: boolean;
				trimmed: boolean;
				spriteSourceSize: { x: number; y: number; w: number; h: number };
				sourceSize: { w: number; h: number };
			}
		> = {};

		this.sprites.forEach((sprite, name) => {
			const trim = this.trimData.get(name);
			const trimmed = !!trim;

			frames[name] = {
				frame: {
					x: sprite.x,
					y: sprite.y,
					w: sprite.width,
					h: sprite.height
				},
				rotated: false,
				trimmed,
				spriteSourceSize: {
					x: trim?.offsetX ?? 0,
					y: trim?.offsetY ?? 0,
					w: sprite.width,
					h: sprite.height
				},
				sourceSize: {
					w: trim?.origWidth ?? sprite.width,
					h: trim?.origHeight ?? sprite.height
				}
			};
		});

		return {
			frames,
			meta: {
				app: 'OpenTXPacker',
				version: '1.0',
				image: imageFilename,
				format: 'RGBA8888',
				size: { w: this.atlasWidth, h: this.atlasHeight },
				scale: 1
			}
		};
	}

	private getMultiatlasMetadata(imageFilename: string) {
		const frames: Array<{
			filename: string;
			frame: { x: number; y: number; w: number; h: number };
			rotated: boolean;
			trimmed: boolean;
			sourceSize: { w: number; h: number };
			spriteSourceSize: { x: number; y: number; w: number; h: number };
		}> = [];

		this.sprites.forEach((sprite, name) => {
			const trim = this.trimData.get(name);
			const trimmed = !!trim;

			frames.push({
				filename: name,
				frame: {
					x: sprite.x,
					y: sprite.y,
					w: sprite.width,
					h: sprite.height
				},
				rotated: false,
				trimmed,
				sourceSize: {
					w: trim?.origWidth ?? sprite.width,
					h: trim?.origHeight ?? sprite.height
				},
				spriteSourceSize: {
					x: trim?.offsetX ?? 0,
					y: trim?.offsetY ?? 0,
					w: sprite.width,
					h: sprite.height
				}
			});
		});

		return {
			textures: [
				{
					image: imageFilename,
					format: 'RGBA8888',
					size: { w: this.atlasWidth, h: this.atlasHeight },
					scale: 1,
					frames
				}
			],
			meta: {
				app: 'OpenTXPacker',
				version: '1.0'
			}
		};
	}

	private getGenericJsonMetadata(imageFilename: string) {
		const frames: Array<{
			name: string;
			x: number;
			y: number;
			width: number;
			height: number;
		}> = [];

		this.sprites.forEach((sprite, name) => {
			frames.push({
				name,
				x: sprite.x,
				y: sprite.y,
				width: sprite.width,
				height: sprite.height
			});
		});

		return {
			image: imageFilename,
			width: this.atlasWidth,
			height: this.atlasHeight,
			frames
		};
	}

	resize() {
		const { width, height } = this.scale;
		const padding = 50;

		const zoom = this.calculateOptimalZoom(width, height);
		this.cameras.main.setZoom(zoom);

		const centerX = (width / zoom - this.atlasWidth) / 2;
		const centerY = (height / zoom - this.atlasHeight) / 2;

		this.cameras.main.setScroll(
			Math.min(-padding, centerX - padding),
			Math.min(-padding, centerY - padding)
		);
	}

	update() {
		if (!this.cursors) return;

		if (this.cursors.left.isDown) {
			this.centerPoint.x -= this.cameraSpeed;
		}
		if (this.cursors.right.isDown) {
			this.centerPoint.x += this.cameraSpeed;
		}
		if (this.cursors.up.isDown) {
			this.centerPoint.y -= this.cameraSpeed;
		}
		if (this.cursors.down.isDown) {
			this.centerPoint.y += this.cameraSpeed;
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
		this.atlasBoundary?.destroy();
		this.drawAtlasBoundary();
		this.initializeAtlas();

		// Recenter camera
		this.centerPoint.set(this.atlasWidth / 2, this.atlasHeight / 2);
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

					// Mark the space as used in freeRects
					this.splitFreeRectangles({
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
