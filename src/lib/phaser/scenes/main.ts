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
								this.textures.addImage(name, image);
								URL.revokeObjectURL(url);

								const position = this.findPosition(image.width, image.height);
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
	}

	private drawAtlasBoundary() {
		this.atlasBoundary = this.add.rectangle(0, 0, this.atlasWidth, this.atlasHeight, 0x666666, 0.2);
		this.atlasBoundary.setStrokeStyle(4, 0x666666, 0.5);
		this.atlasBoundary.setOrigin(0, 0);
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
		// Sort free rectangles by area to try smaller spaces first
		this.freeRects.sort((a, b) => a.width * a.height - b.width * b.height);

		for (const freeRect of this.freeRects) {
			if (freeRect.width >= width && freeRect.height >= height) {
				// Found a suitable rectangle
				const position = {
					x: freeRect.x,
					y: freeRect.y,
					width,
					height
				};

				this.splitFreeRectangles(position);
				return position;
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

	private async handleSnapshot(snap: HTMLImageElement, fileType: string) {
		const dataUrl = snap.src;
		const metadata = this.getAtlasMetadata();

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
		const { textureFormat } = options;
		const fileType = textureFormat.toLowerCase().includes('png') ? 'png' : 'webp';

		const offscreenCanvas = document.createElement('canvas');
		offscreenCanvas.width = this.atlasWidth;
		offscreenCanvas.height = this.atlasHeight;
		const offscreenCtx = offscreenCanvas.getContext('2d');

		this.sprites.forEach((sprite) => {
			const texture = sprite.texture;
			const frame = sprite.frame;
			offscreenCtx?.drawImage(
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

		const dataUrl = offscreenCanvas.toDataURL(`image/${fileType}`);

		const snap = new Image();
		snap.src = dataUrl;
		snap.onload = () => {
			this.handleSnapshot(snap, fileType);
		};
	}

	private getAtlasMetadata() {
		const frames: Record<
			string,
			{
				frame: { x: number; y: number; w: number; h: number };
				rotated: boolean;
				trimmed: boolean;
				sourceSize: { w: number; h: number };
			}
		> = {};

		this.sprites.forEach((sprite, name) => {
			frames[name] = {
				frame: {
					x: sprite.x,
					y: sprite.y,
					w: sprite.width,
					h: sprite.height
				},
				rotated: false,
				trimmed: false,
				sourceSize: {
					w: sprite.width,
					h: sprite.height
				}
			};
		});

		return {
			frames,
			meta: {
				app: 'OpenTXPacker',
				version: '1.0',
				image: 'atlas.png',
				format: 'RGBA8888',
				size: { w: this.atlasWidth, h: this.atlasHeight },
				scale: 1
			}
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
