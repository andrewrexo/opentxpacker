import { AUTO } from 'phaser';
import { BootScene } from './scenes/boot';
import LoadScene from './scenes/load';

const config: Phaser.Types.Core.GameConfig = {
	type: AUTO,
	parent: 'canvas-container',
	scale: {
		width: '100%',
		height: '100%',
		mode: Phaser.Scale.NONE,
		autoRound: true,
	},
	disableContextMenu: true,
	transparent: true,
	scene: [BootScene, LoadScene],
	render: {
		powerPreference: 'high-performance',
		pixelArt: true,
	},
};

export default config;
