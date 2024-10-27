<script>
	let exportFormat = $state('Phaser 3');
</script>

<header class="flex items-center justify-between pb-2">
	<h1 class="panel-header">Project Settings</h1>
</header>
<div class="form-control h-[calc(100%-3rem)]">
	<label class="label" for="exportFormat">
		<span class="label-text">Export Format</span>
	</label>
	<select
		id="exportFormat"
		bind:value={exportFormat}
		class="select select-bordered select-sm w-full"
	>
		<option>Phaser 3</option>
		<option>Multiatlas</option>
		<option>JSON</option>
	</select>

	<label class="label mt-2" for="textureFormat">
		<span class="label-text">Texture Format</span>
	</label>
	<select id="textureFormat" class="select select-bordered select-sm w-full">
		<option>PNG-32</option>
		<option>PNG-8</option>
		<option>WebP</option>
	</select>

	<div class="mt-auto grid grid-cols-2 gap-4 pt-4">
		<button class="bigger-button btn btn-neutral justify-between hover:translate-y-[-1px]">
			Modify
			<span class="h-5 w-5">
				<iconify-icon icon="mdi:design" height="1.25rem" width="1.25rem"></iconify-icon>
			</span>
		</button>
		<button class="bigger-button btn btn-neutral justify-between hover:translate-y-[-1px]">
			Export
			<span class="h-5 w-5">
				<iconify-icon icon="streamline:download-box-1-solid" height="1.25rem" width="1.25rem"
				></iconify-icon>
			</span>
		</button>
	</div>
</div>
