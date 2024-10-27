<script>
	import Select from '$lib/components/ui/select.svelte';
	import ButtonItem from '../button-item.svelte';

	let exportFormat = $state('Phaser 3');
	let textureFormat = $state('PNG-32');

	const exportOptions = ['Phaser 3', 'Multiatlas', 'JSON'];
	const textureOptions = ['PNG-32', 'PNG-8', 'WebP'];
</script>

<header class="flex items-center justify-between pb-4">
	<h1 class="panel-header">Project Settings</h1>
</header>

<div class="form-control h-[calc(100%-3rem)]">
	<div class="grid grid-cols-1 gap-2">
		<Select label="Texture Type" options={exportOptions} bind:value={exportFormat} />
		<Select label="File Format" options={textureOptions} bind:value={textureFormat} />
	</div>

	<div class="mt-auto grid grid-cols-1 gap-2 pt-4">
		<ButtonItem caret className="bigger-button">
			<span class="h-5 w-5">
				<iconify-icon icon="line-md:file-export-filled" height="1.25rem" width="1.25rem"
				></iconify-icon>
			</span>
			Export
		</ButtonItem>
	</div>
</div>
