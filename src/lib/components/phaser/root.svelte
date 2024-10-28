<script lang="ts">
	import phaserState from '$lib/state/phaser.svelte';

	// this should be dynamic based on the sidebar sizes. not a great solution atm
	const resizePhaser = () => {
		if (!phaserState.phaser) return;

		const leftSidebar = 256; // 64rem
		const rightSidebar = 256; // 72rem
		phaserState.phaser.scale.resize(
			window.innerWidth - leftSidebar - rightSidebar,
			window.innerHeight
		);
	};

	$effect(() => {
		if (!phaserState.phaser) {
			window.addEventListener('resize', resizePhaser);
		}

		return () => {
			window.removeEventListener('resize', resizePhaser);
		};
	});

	$effect(() => {
		if (phaserState.phaser) return;

		phaserState.startPhaser();
	});
</script>

<div id="canvas-container" class="max-w-full overflow-hidden"></div>
