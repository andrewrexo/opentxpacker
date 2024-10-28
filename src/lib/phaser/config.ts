import { AUTO } from 'phaser';
import { BootScene } from './scenes/boot';
import LoadScene from './scenes/load';
import MainScene from './scenes/main';
const config: Phaser.Types.Core.GameConfig = {
	type: AUTO,
	parent: 'canvas-container',
	scale: {
		mode: Phaser.Scale.NONE,
		width: '100%',
		height: '100%',
		autoCenter: Phaser.Scale.CENTER_BOTH
	},
	disableContextMenu: true,
	transparent: true,
	scene: [BootScene, LoadScene, MainScene],
	render: {
		powerPreference: 'high-performance',
		pixelArt: true,
	},
};

export default config;
