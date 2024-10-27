<script lang="ts">
	import Canvas from '$lib/components/layout/canvas.svelte';
	import Greet from '$lib/components/layout/greet.svelte';
	import Library from '$lib/components/layout/library.svelte';
	import Settings from '$lib/components/layout/settings.svelte';
</script>

<div class="flex h-screen bg-base-200">
	<!-- Left Sidebar -->
	<div class="w-64 border-r border-base-300 bg-base-100 p-4">
		<header class="flex items-center justify-between pb-4">
			<h1 class="panel-header flex items-center gap-3">New Project</h1>
		</header>
		<div class="flex flex-col gap-8">
			<Greet />
			<Library />
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="flex-1 p-4">
		<Canvas />
	</div>

	<!-- Right Settings Panel -->
	<div class="w-72 border-l border-base-300 bg-base-100 p-4">
		<Settings />
	</div>
</div>
