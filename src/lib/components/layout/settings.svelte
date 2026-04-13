<script lang="ts">
	import Select from '$lib/components/primitives/select.svelte';
	import eventBus from '$lib/phaser/event-bus';
	import Button from '../primitives/button.svelte';

	let exportFormat = $state('Phaser 3');
	let textureFormat = $state('PNG-32');
	let atlasSize = $state('1024x1024');
	let spritePadding = $state('0');
	let trimTransparency = $state(false);
	let packAlgorithm = $state('MaxRects');
	let packHeuristic = $state('BestShortSideFit');

	const exportOptions = ['Phaser 3', 'Multiatlas', 'JSON'];
	const textureOptions = ['PNG-32', 'PNG-8', 'WebP'];
	const atlasSizeOptions = ['Auto', '256x256', '512x512', '1024x1024', '2048x2048', '4096x4096'];
	const paddingOptions = ['0', '1', '2', '4', '8'];
	const algorithmOptions = ['MaxRects', 'Basic'];
	const heuristicOptions = [
		'BestShortSideFit',
		'BestLongSideFit',
		'BestAreaFit',
		'BottomLeftRule',
		'ContactPointRule'
	];

	const handleAtlasSizeChange = () => {
		if (atlasSize === 'Auto') {
			eventBus.emit('autoSizeAtlas');
		} else {
			const [w, h] = atlasSize.split('x').map(Number);
			eventBus.emit('resizeAtlas', { width: w, height: h });
		}
	};

	// Listen for auto-size result to update the dropdown display
	eventBus.on('atlasSizeChanged', (size: string) => {
		// Don't override if user manually set a size
		if (atlasSize === 'Auto') {
			// Keep "Auto" selected but we could update a label
		}
	});

	const handlePaddingChange = () => {
		eventBus.emit('setPadding', parseInt(spritePadding));
	};

	const handleTrimChange = () => {
		eventBus.emit('setTrimEnabled', trimTransparency);
	};

	const handleAlgorithmChange = () => {
		eventBus.emit('setAlgorithm', packAlgorithm);
	};

	const handleHeuristicChange = () => {
		eventBus.emit('setHeuristic', packHeuristic);
	};

	const handleExport = () => {
		eventBus.emit('exportAtlas', {
			format: exportFormat,
			textureFormat: textureFormat
		});
	};
</script>

<header class="flex items-center justify-between pb-2">
	<h1 class="text-lg font-bold">Configuration</h1>
</header>

<div class="form-control h-[calc(100%-2rem)]">
	<div class="grid grid-cols-1 gap-2 pb-4">
		<Select label="Algorithm" options={algorithmOptions} bind:value={packAlgorithm} onchange={handleAlgorithmChange} />
		{#if packAlgorithm === 'MaxRects'}
			<Select label="Heuristic" options={heuristicOptions} bind:value={packHeuristic} onchange={handleHeuristicChange} />
		{/if}
		<Select label="Atlas Size" options={atlasSizeOptions} bind:value={atlasSize} onchange={handleAtlasSizeChange} />
		<Select label="Padding" options={paddingOptions} bind:value={spritePadding} onchange={handlePaddingChange} />
		<label class="label cursor-pointer justify-start gap-3 px-0">
			<input
				type="checkbox"
				class="toggle toggle-sm toggle-primary"
				bind:checked={trimTransparency}
				onchange={handleTrimChange}
			/>
			<span class="label-text text-sm font-bold">Trim Transparency</span>
		</label>
		<Select label="Texture Type" options={exportOptions} bind:value={exportFormat} />
		<Select label="File Format" options={textureOptions} bind:value={textureFormat} />
	</div>

	<div class="mt-auto grid grid-cols-1 gap-2">
		<Button
			caret
			className="bigger-button"
			onclick={() => {
				handleExport();
			}}
		>
			<span class="h-5 w-5">
				<iconify-icon icon="line-md:file-export-filled" height="1.25rem" width="1.25rem"
				></iconify-icon>
			</span>
			Export
		</Button>
	</div>
	<div class="divider mb-2"></div>
	<span class="mx-auto pb-4 pt-1 text-center text-xs text-base-content/50">
		beta version 0.1.0.
		<br />
		contact:
		<a
			href="mailto:andrew@rubes.dev"
			target="_blank"
			class="link brightness-125 hover:text-secondary"
		>
			andrew@rubes.dev
		</a>
	</span>
	<div class="flex items-center justify-center gap-2 text-primary">
		<a
			aria-label="Twitter"
			href="https://x.com/drdreidelrx/"
			target="_blank"
			class="btn btn-circle flex items-center justify-center gap-2 hover:scale-105 hover:text-primary"
		>
			<iconify-icon icon="line-md:twitter-x" height="1.25rem" width="1.25rem"></iconify-icon>
		</a>
		<a
			aria-label="GitHub"
			href="https://github.com/andrewrexo"
			target="_blank"
			class="btn btn-circle flex items-center justify-center gap-2 hover:scale-105 hover:text-primary"
		>
			<iconify-icon icon="line-md:github" height="1.25rem" width="1.25rem"></iconify-icon>
		</a>
		<a
			aria-label="Portfolio"
			href="https://rubes.dev/"
			target="_blank"
			class="btn btn-circle flex items-center justify-center gap-2 hover:scale-105 hover:text-primary"
		>
			<iconify-icon icon="line-md:person" height="1.25rem" width="1.25rem"></iconify-icon>
		</a>
	</div>
</div>
