<script lang="ts">
	import { Game } from 'phaser';
	import config from '$lib/phaser/config';

	let game: Game;

	const StartGame = (parent: string) => {
		return new Game({ ...config, parent });
	};

	// this should be dynamic based on the sidebar sizes. not a great solution atm
	const resizeGame = () => {
		const leftSidebar = 256; // 64rem
		const rightSidebar = 256; // 72rem
		game.scale.resize(window.innerWidth - leftSidebar - rightSidebar, window.innerHeight);
	};

	$effect(() => {
		if (!game) {
			game = StartGame('canvas-container');
			window.addEventListener('resize', resizeGame);
		}
		return () => {
			window.removeEventListener('resize', resizeGame);
		};
	});
</script>

<div id="canvas-container" class="max-w-full overflow-hidden"></div>
