<script lang="ts">
	import { Game } from 'phaser';
	import { debounce } from 'lodash';
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

	const debouncedResize = debounce(resizeGame, 250);

	$effect(() => {
		if (!game) {
			game = StartGame('canvas-container');
			window.addEventListener('resize', debouncedResize);
		}
		return () => {
			window.removeEventListener('resize', debouncedResize);
			debouncedResize.cancel();
		};
	});
</script>

<div id="canvas-container" class="max-w-full overflow-hidden"></div>
