<script>
	import Select from '$lib/components/primitives/select.svelte';
	import eventBus from '$lib/phaser/event-bus';
	import Button from '../primitives/button.svelte';

	let exportFormat = $state('Phaser 3');
	let textureFormat = $state('PNG-32');

	const exportOptions = ['Phaser 3', 'Multiatlas', 'JSON'];
	const textureOptions = ['PNG-32', 'PNG-8', 'WebP'];

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
