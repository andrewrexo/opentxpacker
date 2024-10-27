import { Scene } from 'phaser';

export class Boot extends Scene {
	create() {
		this.add.text(100, 100, 'Hello World');
	}
}
