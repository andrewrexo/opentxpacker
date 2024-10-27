import { Scene } from 'phaser';

export class BootScene extends Scene {
	constructor() {
		super({ key: 'boot' });
	}

	create() {
		this.scene.start('load');
	}
}
