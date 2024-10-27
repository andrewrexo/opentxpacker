import { Scene } from "phaser";

export default class LoadScene extends Scene {
	private logo!: Phaser.GameObjects.Image;
	private logoOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, -20);

	constructor() {
		super({ key: 'load' });
	}

	preload() {
		this.load.image('logo', '/logo.png');
	}

	create() {
		this.cameras.main.fadeIn(500, 32, 37, 46);
		this.logo = this.add.image(0, 0, 'logo').setAlpha(0.5);
		this.game.scale.on('resize', this.resize, this);
		this.resize();
	}

	getCenter() {
		return new Phaser.Math.Vector2(this.cameras.main.centerX, this.cameras.main.centerY);
	}

	resize() {
		this.logo.setPosition(this.getCenter().x + this.logoOffset.x, this.getCenter().y + this.logoOffset.y);
	}
}
