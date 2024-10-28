import config from '$lib/phaser/config';
import { Game } from 'phaser';

const createPhaserState = () => {
	let phaser: Game | null = $state(null);

	const parentId = 'canvas-container';

	const startPhaser = (parent: string) => {
		return new Game({ ...config, parent });
	};

	return {
		get phaser() {
			return phaser;
		},
		startPhaser() {
			phaser = startPhaser(parentId);
		}
	};
};

const phaserState = createPhaserState();

export default phaserState;
