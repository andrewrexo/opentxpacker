import { Scene } from 'phaser';
import { EventBus } from '../event-bus';

export default class MainScene extends Scene {
	private sprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
	private logo!: Phaser.GameObjects.Image;
	private logoOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, -20);
	private resizeTimer: number | null = null;

	constructor() {
		super({ key: 'main' });
	}

	create() {
		this.cameras.main.fadeIn(500, 32, 37, 46);

		// Set initial camera position to center of the scene
		const center = new Phaser.Math.Vector2(0, 0);
		this.cameras.main.centerOn(center.x, center.y);

		// Place logo at origin (0,0) since camera will handle positioning
		this.logo = this.add.image(0, 0, 'logo').setAlpha(0.5);

		// Replace direct resize binding with debounced version
		this.game.scale.on(
			'resize',
			() => {
				if (this.resizeTimer) {
					clearTimeout(this.resizeTimer);
				}
				this.resizeTimer = window.setTimeout(() => {
					this.resize();
					this.resizeTimer = null;
				}, 100) as unknown as number;
			},
			this
		);

		this.resize();

		EventBus.on('SPRITE_UPLOADED', this.handleSpriteUpload, this);
	}

	private handleSpriteUpload(data: { name: string; width: number; height: number; data: string }) {
		// Create a temporary image element to load the texture
		const image = new Image();
		image.onload = () => {
			// Only add the texture once the image is loaded
			this.textures.addBase64(data.name, data.data);

			if (this.sprites.size === 0) {
				this.logo.setVisible(false);
			}

			// Wait a frame to ensure texture is properly loaded into GPU
			this.time.delayedCall(0, () => {
				// Place new sprites relative to scene origin (0,0)
				const sprite = this.add.sprite(0, 0, data.name);

				sprite.setInteractive();
				this.input.setDraggable(sprite);
				this.sprites.set(data.name, sprite);
			});
		};

		// Start loading the image
		image.src = data.data;
	}

	resize() {
		const { width, height } = this.scale;

		// Update camera bounds while maintaining relative position
		const currentCenterX = this.cameras.main.midPoint.x;
		const currentCenterY = this.cameras.main.midPoint.y;

		this.cameras.main.setBounds(-width / 2, -height / 2, width, height);

		// Restore the camera to its previous relative position
		this.cameras.main.centerOn(currentCenterX, currentCenterY);
	}
}
