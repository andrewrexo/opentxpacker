import { Scene } from "phaser";

export default class LoadScene extends Scene {
	constructor() {
		super({ key: 'load' });
	}

	preload() {
		this.load.image('logo', '/logo.png');
	}

	create() {
		this.scene.start('main');
	}
}
