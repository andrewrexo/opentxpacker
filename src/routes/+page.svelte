<script lang="ts">
	import Canvas from '$lib/components/layout/canvas.svelte';
	import Greet from '$lib/components/layout/greet.svelte';
	import Library from '$lib/components/layout/library.svelte';
	import Settings from '$lib/components/layout/settings.svelte';
</script>

<div class="flex h-screen bg-base-200">
	<!-- Left Sidebar -->
	<div class="w-64 border-r border-base-300 bg-base-100 p-4">
		<header class="flex flex-col gap-2 pb-4">
			<h1 class="panel-header">New Project</h1>
			<span class="text-sm text-base-content/70">
				Get started with <code class="code-snippet">opentxpacker</code>. Import your textures and
				let us handle the rest.
			</span>
		</header>
		<div class="flex flex-col gap-2">
			<Greet />
			<div class="divider my-0 pb-4 pt-6"></div>
			<Library />
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="flex-1">
		<Canvas />
	</div>

	<!-- Right Settings Panel -->
	<div class="w-72 border-l border-base-300 bg-base-100 p-4">
		<Settings />
	</div>
</div>
