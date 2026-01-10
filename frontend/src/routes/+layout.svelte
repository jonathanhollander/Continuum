<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import logo from "$lib/assets/logo.png";
	import "../app.css";
	import { page } from "$app/stores";
	import { onMount, setContext } from "svelte";
	import { goto } from "$app/navigation";
	import { estateAudit } from "$lib/stores/auditStore";
	import ConciergeSettings from "$lib/components/concierge/ConciergeSettings.svelte";
	import CompassPanel from "$lib/components/layout/CompassPanel.svelte";
	import { language, userRole, type UserRole } from "$lib/stores/concierge";
	import { dictionary } from "$lib/stores/dictionary";

	import GlobalSimBanner from "$lib/components/simulator/GlobalSimBanner.svelte";

	import {
		LayoutDashboard,
		Shield,
		History,
		Home,
		User,
		Compass,
		Settings,
		LogOut,
		FileText,
		BookOpen,
		Receipt,
		Hammer,
		Gift,
		Calendar,
		Users,
		Star,
		Plus,
		ArrowRight,
		Menu,
		X,
		Search,
		Bell,
		ChevronDown,
		ChevronRight,
		CreditCard,
		Activity,
		Briefcase,
		Heart,
		Dog,
		Scroll,
		Siren,
		Library,
		Wallet,
		Files,
		QrCode,
		ScanLine,
		ShieldCheck,
		Box,
		Sparkles,
		Layers,
		BarChart3,
		Globe,
	} from "lucide-svelte";
	import { fade, fly } from "svelte/transition";
	import Modal from "$lib/components/ui/Modal.svelte";
	import { t } from "$lib/stores/concierge";
	import { toneStore, type AppTone } from "$lib/stores/toneStore";
	import CommandCenter from "$lib/components/ui/CommandCenter.svelte";
	import { magicTrigger } from "$lib/stores/magicStore";
	import SuccessParticles from "$lib/components/ui/SuccessParticles.svelte";

	import { genesisStore } from "$lib/stores/genesisStore";
	import TheArchitect from "$lib/components/wizard/TheArchitect.svelte";
	import GodModeToggle from "$lib/components/wizard/GodModeToggle.svelte";
	import Sidebar from "$lib/components/layout/Sidebar.svelte";
	import FocusFooter from "$lib/components/layout/FocusFooter.svelte";
	import { navGroups } from "$lib/config/navigation";
	import { compassStore } from "$lib/stores/compassStore";

	let { children } = $props();

	let isSidebarOpen = $state(false);
	let showSettings = $state(false);
	let showCommandCenter = $state(false);
	let isCompassOpen = $state(false);

	// Derived: Are we in Focus Mode? (Active Block + NOT God Mode)
	// Note: We also exclude the actual /wizard route from this logic as it has its own layout
	let isFocusMode = $derived(
		$genesisStore.activeBlock &&
			!$genesisStore.isGodMode &&
			$page.url.pathname !== "/wizard",
	);

	// Sync Compass Content to Architect
	// When route changes, compassStore updates. We use that for The Architect's data.
	$effect(() => {
		if ($page.url.pathname) {
			compassStore.updateContext($page.url.pathname);
		}
	});

	import { registerAccount } from "$lib/stores/keyringStore";

	onMount(() => {
		// Handoff Pickup Logic
		const email = $page.url.searchParams.get("email");
		const lang = $page.url.searchParams.get("lang");

		if (email) {
			registerAccount(email);
			if (lang) language.set(lang as any);

			// Clean URL after pickup
			const cleanUrl = $page.url.pathname + $page.url.hash;
			goto(cleanUrl, { replaceState: true });
		}
	});

	// Derived: Is this the Wizard or Marketing Landing?
	let isWizardRoute = $derived($page.url.pathname.startsWith("/wizard"));
	let isMarketingRoute = $derived(
		$page.url.pathname.startsWith("/marketing"),
	);

	onMount(() => {
		// Run audit on load and periodically
		estateAudit.runAudit();
		const interval = setInterval(() => estateAudit.runAudit(), 5000);

		const handleGlobalKeydown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				showCommandCenter = !showCommandCenter;
			}
		};

		window.addEventListener("keydown", handleGlobalKeydown);

		return () => {
			clearInterval(interval);
			window.removeEventListener("keydown", handleGlobalKeydown);
		};
	});

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function toggleCompass() {
		isCompassOpen = !isCompassOpen;
	}

	$effect(() => {
		// Navigation Guard
		if (!isWizardRoute && !isMarketingRoute) {
			const allItems = navGroups.flatMap((g) => g.items);
			const currentItem = allItems.find(
				(item) => item.href === $page.url.pathname,
			);
			if (currentItem && !currentItem.allowedRoles.includes($userRole)) {
				goto("/");
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Continuum</title>
</svelte:head>

{#if isWizardRoute || isMarketingRoute}
	<!-- Wizard/Marketing Mode: Full exclusion of standard layout -->
	{@render children()}
{:else}
	<!-- Standard Application Layout -->
	<div
		dir={$language === "he" ? "rtl" : "ltr"}
		class="min-h-screen bg-background flex flex-col font-sans text-foreground"
	>
		<GlobalSimBanner />
		<div class="flex flex-1">
			<!-- Mobile Sidebar Overlay -->
			{#if isSidebarOpen}
				<button
					class="fixed inset-0 bg-background/80 z-40 lg:hidden backdrop-blur-sm cursor-default w-full h-full border-0"
					transition:fade={{ duration: 200 }}
					onclick={toggleSidebar}
					aria-label="Close sidebar"
					onkeydown={(e) => e.key === "Escape" && toggleSidebar()}
				></button>
			{/if}

			<!-- Sidebar (Standard) -->
			{#if !isFocusMode}
				<Sidebar
					bind:isOpen={isSidebarOpen}
					onClose={() => (isSidebarOpen = false)}
				/>
			{:else}
				<!-- Focus Mode: The Architect -->
				<div
					class="hidden lg:block h-screen sticky top-0 z-50 shadow-2xl"
				>
					<TheArchitect
						title={$compassStore.title}
						blueprint={$compassStore.mission}
						why={$compassStore.human_impact}
						tip={$compassStore.pro_tips?.[0] ||
							"Take it one step at a time."}
						backLink="/wizard"
					/>
				</div>
			{/if}

			<!-- Main Content Wrapper -->
			<div
				class="flex-1 ml-0 lg:ml-0 flex flex-col min-w-0 bg-background relative"
			>
				<!-- Mobile Header -->
				<header
					class="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-sm"
				>
					<div class="flex items-center gap-3">
						<button
							class="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
							onclick={toggleSidebar}
						>
							<Menu class="w-6 h-6" />
						</button>
						<span class="font-semibold text-slate-900"
							>Continuum</span
						>
					</div>

					<a
						href="/settings"
						class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
					>
						<Settings class="w-5 h-5" />
					</a>
				</header>

				<!-- Glass Header (Desktop) -->
				{#if !isFocusMode}
					<header
						class="hidden lg:flex sticky top-0 z-40 h-20 px-8 items-center justify-between
                bg-white/60 backdrop-blur-xl border-b border-slate-200/60 transition-all"
					>
						<!-- Breadcrumbs / Page Title -->
						<div
							class="flex items-center gap-2 text-sm text-muted-foreground"
						>
							<span
								class="uppercase tracking-wider font-semibold text-xs text-slate-500"
								>{$t.groupOverview || "Estate Overview"}</span
							>
							<ChevronRight size={14} class="text-slate-400" />
							<span
								class="font-serif text-slate-800 font-medium text-lg"
							>
								{$page.url.pathname === "/"
									? $t.dashboard
									: $page.url.pathname.includes("catalog")
										? $t.catalog
										: $t[
												navGroups
													.flatMap((g) => g.items)
													.find(
														(i) =>
															i.href ===
															$page.url.pathname,
													)?.key || ""
											] || $t.activeModule}
							</span>
						</div>

						<!-- Header Actions -->
						<div class="flex items-center gap-6">
							<!-- Role Switcher -->
							<div
								class="hidden md:flex items-center bg-gray-100 rounded-lg p-1"
							>
								{#each ["Owner", "Executor", "Family"] as role}
									<button
										onclick={() =>
											userRole.set(role as UserRole)}
										class="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                                    {$userRole === role
											? 'bg-slate-900 text-white shadow-sm'
											: 'text-slate-400 hover:text-slate-600'}"
									>
										{$t["role" + role] || role}
									</button>
								{/each}
							</div>

							<!-- Language Selector (Top Menu) -->
							<div
								class="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 max-w-[100px]"
							>
								<Globe
									size={14}
									class="text-slate-400 shrink-0"
								/>
								<select
									value={$language}
									onchange={(e) =>
										language.set(
											e.currentTarget.value as any,
										)}
									class="bg-transparent text-[10px] font-bold text-slate-600 uppercase tracking-tight outline-none cursor-pointer hover:text-slate-900 transition-colors border-none p-0 pr-1 focus:ring-0 min-w-0"
								>
									<option value="en">🇺🇸 EN</option>
									<option value="es">🇪🇸 ES</option>
									<option value="fr">🇫🇷 FR</option>
									<option value="de">🇩🇪 DE</option>
									<option value="ru">🇷🇺 RU</option>
									<option value="he">🇮🇱 HE</option>
								</select>
							</div>

							<!-- Compass Trigger -->
							<button
								onclick={toggleCompass}
								class="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20"
								title="Open Strategy Guide"
							>
								<Compass size={18} />
								<span class="text-sm font-bold hidden sm:inline"
									>{$t.compass}</span
								>
							</button>

							<img
								src={logo}
								alt="Continuum Logo"
								class="h-8 w-auto"
							/>
						</div>
					</header>
				{:else}
					<!-- Focus Mode Header -->
					<header
						class="hidden lg:flex sticky top-0 z-40 h-20 px-8 items-center justify-between bg-slate-900/90 backdrop-blur-xl border-b border-white/5 transition-all"
					>
						<div class="flex items-center gap-3">
							<div
								class="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400"
							>
								Construction Active
							</div>
							<div
								class="h-1 w-1 rounded-full bg-indigo-500 animate-pulse"
							></div>
						</div>
						<GodModeToggle />
					</header>
				{/if}

				<main class="flex-1 overflow-x-hidden pb-20">
					<div
						class="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full"
					>
						{@render children()}
					</div>
				</main>

				{#if isFocusMode}
					<FocusFooter />
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Settings Modal -->
<Modal
	open={showSettings}
	title="Concierge Settings"
	on:close={() => (showSettings = false)}
>
	<ConciergeSettings />
</Modal>

{#if showCommandCenter}
	<CommandCenter on:close={() => (showCommandCenter = false)} />
{/if}

{#if $magicTrigger}
	<SuccessParticles />
{/if}

<style>
	/* Custom scrollbar for sidebar navigation */
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 20px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}
</style>
