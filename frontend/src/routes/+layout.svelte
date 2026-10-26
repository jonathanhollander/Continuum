<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import logo from "$lib/assets/logo.png";
	import "../app.css";
	import { page } from "$app/stores";
	import { onMount, setContext } from "svelte";
	import { goto } from "$app/navigation";
	import { estateAudit } from "$lib/stores/auditStore.svelte";
	import ConciergePanel from "$lib/components/layout/ConciergePanel.svelte";
	import { conciergeEngine } from "$lib/stores/conciergeEngine";
	import {
		language,
		userRole,
		type UserRole,
	} from "$lib/stores/conciergeStore.svelte";
	import { dictionary } from "$lib/stores/dictionary";
	import { logger } from "$lib/utils/logger";
	import {
		overwhelmDetector,
		overwhelmState,
	} from "$lib/services/overwhelmDetection";
	import BreakOffer from "$lib/components/BreakOffer.svelte";

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
		Loader2,
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
		Palette,
	} from "lucide-svelte";
	import { fade, fly } from "svelte/transition";
	import { dict } from "$lib/stores/conciergeStore.svelte";
	import { toneStore, type AppTone } from "$lib/stores/toneStore.svelte";
	import CommandCenter from "$lib/components/ui/CommandCenter.svelte";
	import { magicTrigger } from "$lib/stores/magicStore";
	import SuccessParticles from "$lib/components/ui/SuccessParticles.svelte";

	import { genesisStore } from "$lib/stores/genesisStore";
	import TheArchitect from "$lib/components/wizard/TheArchitect.svelte";
	import GodModeToggle from "$lib/components/wizard/GodModeToggle.svelte";
	import Sidebar from "$lib/components/layout/Sidebar.svelte";
	import FocusFooter from "$lib/components/layout/FocusFooter.svelte";
	import MobileBottomNav from "$lib/components/layout/MobileBottomNav.svelte";
	import { navGroups, pulseSubNav, catalogCategories } from "$lib/config/navigation";
	import { compassStore } from "$lib/stores/compassStore";
	import NotificationContainer from "$lib/components/NotificationContainer.svelte";
	import RoleSwitcher from "$lib/components/RoleSwitcher.svelte";
	import { contextStore } from "$lib/stores/contextStore.svelte";
	import TakeBreakButton from "$lib/components/TakeBreakButton.svelte";
	import MediaMigrationNotice from "$lib/components/MediaMigrationNotice.svelte";
	import { accessibilityStore } from "$lib/stores/accessibilityStore";

	let { children } = $props();

	let isSidebarOpen = $state(false);

	// Breadcrumb: the page's name as the sidebar shows it (English names from
	// navigation.ts, other languages from the dictionary), else the page's own
	// `title` from its load, else the generic label.
	let breadcrumbTitle = $derived.by(() => {
		const path = $page.url.pathname;
		const item = [
			...navGroups.flatMap((g) => g.items),
			...pulseSubNav,
			...catalogCategories.flatMap((c) => c.items),
		].find(
			(i) => i.href === path,
		);
		if (item) return $language === "en" ? item.label : $dict[item.key] || item.label;
		const own = ($page.data as { title?: string } | undefined)?.title;
		return own || $dict.activeModule;
	});
	let isCompassOpen = $state(false);
	let showCommandCenter = $state(false);

	// Derived: Are we in Focus Mode? (Active Block + NOT God Mode)
	// Note: We also exclude the actual /wizard route from this logic as it has its own layout
	let isFocusMode = $derived(
		$genesisStore.activeBlock &&
			!$genesisStore.isGodMode &&
			($page.url.pathname as string) !== "/wizard",
	);

	// Sync Compass Content to Architect
	// When route changes, compassStore updates. We use that for The Architect's data.
	let previousPath = $state<string>("");
	$effect(() => {
		if ($page.url.pathname) {
			compassStore.updateContext($page.url.pathname);
			overwhelmDetector.recordNavigation($page.url.pathname);
			logger.debug("Navigation tracked", { path: $page.url.pathname });

			// Detect back button navigation
			if (previousPath && $page.url.pathname !== previousPath) {
				// Simple heuristic: if we're going to a "simpler" path, it might be back navigation
				if (
					$page.url.pathname.split("/").length <
					previousPath.split("/").length
				) {
					overwhelmDetector.recordBackButton();
				}
			}
			previousPath = $page.url.pathname;
		}
	});

	import { auth } from "$lib/stores/auth";
	import { syncAll, clearAll } from "$lib/services/sync.svelte";

	// Derived: Is this the Wizard or Marketing Landing?
	let isWizardRoute = $derived(
		$page.url.pathname.startsWith("/wizard") ||
			$page.url.pathname.startsWith("/start"),
	);
	// Onboarding and the welcome page are full-screen like the wizard (own logo,
	// no sidebar); they stay behind sign-in, so isWizardRoute is left alone.
	let isFullScreenRoute = $derived(
		isWizardRoute ||
			$page.url.pathname === "/onboarding" ||
			$page.url.pathname === "/welcome" ||
			$page.url.pathname.startsWith("/admin"),
	);
	let isMarketingRoute = $derived(
		$page.url.pathname.startsWith("/marketing") ||
			$page.url.pathname === "/",
	);

	// Derived: Is this an Auth or Public Pulse route?
	let isAuthRoute = $derived(
		$page.url.pathname === "/login" ||
			$page.url.pathname === "/signup" ||
			$page.url.pathname.startsWith("/auth/") ||
			$page.url.pathname.startsWith("/pulse/respond/") ||
			$page.url.pathname.startsWith("/pulse/verify/") ||
			$page.url.pathname.startsWith("/pulse/portal/") ||
			// Guardian alert emails link here (backend/pulse_logic.py); trailing slash keeps "/portalX" protected
			$page.url.pathname.startsWith("/portal/") ||
			// Recipient start page (card D2): opened from the owner's link with no sign-in
			$page.url.pathname.startsWith("/for/"),
	);

	// Recipient start page and the owner's preview (card X104): both read one server-filtered
	// payload, so the owner's whole record set is left unsynced there until they move on.
	let isRecipientRoute = $derived($page.url.pathname.startsWith("/for/"));

	// Derived: Is this the Dashboard route? (needs dark background for glassmorphism)
	let isDashboardRoute = $derived($page.url.pathname === "/dashboard");

	// Pages whose own content is dark: the header sits dark above them too.
	const darkHeaderPaths = [
		"/dashboard",
		"/resources/grief-support",
		"/modules/analytics",
		"/modules/treasure-hunt",
		"/admin/readiness",
		"/onboarding",
		"/modules/pulse",
	];
	let isDarkHeader = $derived(darkHeaderPaths.includes($page.url.pathname));

	// Sync Data when Auth is ready
	let lastSyncedToken = $state<string | null>(null);
	$effect(() => {
		// Signed out: forget in-memory records so the next account never sees them.
		if (!$auth.token && !$auth.loading && lastSyncedToken) {
			lastSyncedToken = null;
			clearAll();
		}
		if ($auth.token && !$auth.loading && $auth.token !== lastSyncedToken && !isRecipientRoute) {
			console.log("[Layout] Auth detected, starting global sync...");
			lastSyncedToken = $auth.token;
			// Card X142: the page's own stores first, the rest a moment later (see syncAll);
			// the dashboard shows every module, so it takes them all at once.
			syncAll({ everything: isDashboardRoute });

			// Initialize overwhelm detector from user preference
			if ($auth.user) {
				overwhelmDetector.initialize(!!$auth.user.overwhelm_muted);
			}
		}
	});

	// Update concierge context on route change
	$effect(() => {
		conciergeEngine.setContext($page.url.pathname);
	});

	onMount(() => {
		// Initialize auth store (load token from localStorage, fetch user)
		auth.init();

		// Initialize context-aware messaging from user profile
		contextStore.refresh();

		// Run audit on load
		estateAudit.runAudit();

		// Handoff pickup from the marketing CTA (/start?email=&lang=) only. The /start page reads
		// the email itself; the account becomes active at sign-in (auth.ts), never from a URL.
		const email = $page.url.searchParams.get("email");
		const lang = $page.url.searchParams.get("lang");

		if (email && $page.url.pathname === "/start") {
			if (lang) language.set(lang as any);

			// Clean URL after pickup, keeping any other params
			const clean = new URL($page.url);
			clean.searchParams.delete("email");
			clean.searchParams.delete("lang");
			goto(clean.pathname + clean.search + clean.hash, { replaceState: true });
		}

		const handleGlobalKeydown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				showCommandCenter = !showCommandCenter;
			}
		};

		// Handle overwhelm detection events
		const handleRequestHelp = () => {
			logger.info("Help requested from overwhelm detection");
			// Open AI Concierge
			conciergeEngine.open();
		};

		const handleMobileSidebarToggle = () => {
			isSidebarOpen = !isSidebarOpen;
		};

		window.addEventListener("keydown", handleGlobalKeydown);
		window.addEventListener("continuum:request-help", handleRequestHelp);
		window.addEventListener(
			"toggle-mobile-sidebar",
			handleMobileSidebarToggle,
		);

		return () => {
			window.removeEventListener("keydown", handleGlobalKeydown);
			window.removeEventListener(
				"continuum:request-help",
				handleRequestHelp,
			);
			window.removeEventListener(
				"toggle-mobile-sidebar",
				handleMobileSidebarToggle,
			);
		};
	});

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function toggleCompass() {
		isCompassOpen = !isCompassOpen;
	}

	$effect(() => {
		// Navigation Guard & Auth Protection
		if (!$auth.loading) {
			const isPublicRoute =
				isWizardRoute || isMarketingRoute || isAuthRoute;

			if (!isPublicRoute && !$auth.user && !$auth.token && !$auth.offline) {
				console.log(
					"[Layout] Unauthorized access to protected route, redirecting to login...",
				);
				goto("/login");
				return;
			}

			// If logged in, protect based on roles
			if ($auth.user && !isWizardRoute && !isMarketingRoute) {
				const allItems = navGroups.flatMap((g) => g.items);
				const currentItem = allItems.find(
					(item) => item.href === $page.url.pathname,
				);
				if (
					currentItem &&
					!currentItem.allowedRoles.includes($userRole)
				) {
					console.warn(
						`[Layout] Role ${$userRole} not authorized for ${$page.url.pathname}`,
					);
					goto("/dashboard");
				}
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Continuum</title>
</svelte:head>

<!-- Global Notification Container (appears on ALL pages, including auth) -->
<NotificationContainer />

<!-- Media Migration Notice (prompts IndexedDB → Cloud migration when needed) -->
<MediaMigrationNotice />

{#if $auth.loading}
	<!-- Global Loading State -->
	<div
		class="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans"
	>
		<div class="relative">
			<div
				class="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"
			></div>
			<Loader2
				class="w-12 h-12 text-primary animate-spin relative z-10"
			/>
		</div>
		<p class="mt-6 text-muted-foreground font-medium tracking-wide animate-pulse">
			Verifying your security credentials...
		</p>
	</div>
{:else if isFullScreenRoute || isMarketingRoute || isAuthRoute}
	<!-- Wizard/Marketing Mode: Full exclusion of standard layout -->
	{@render children()}
{:else}
	<!-- Standard Application Layout -->
	<div
		dir={$language === "he" ? "rtl" : "ltr"}
		class="min-h-screen flex flex-col font-sans {isDashboardRoute
			? 'bg-[#0F1115] text-white'
			: 'bg-background text-foreground'}"
	>
		<a
			href="#main-content"
			class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-slate-900 focus:shadow-lg focus:ring-2 focus:ring-primary"
			>Skip to main content</a
		>
		<GlobalSimBanner />
		<div class="flex flex-1">
			<!-- Mobile Sidebar Overlay -->
			{#if isSidebarOpen}
				<button
					class="fixed inset-0 z-40 lg:hidden backdrop-blur-sm cursor-default w-full h-full border-0 {isDarkHeader
						? 'bg-black/80'
						: 'bg-background/80'}"
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
					class="hidden lg:block h-screen sticky top-0 z-30 shadow-2xl"
				>
					<TheArchitect
						title={$compassStore.title}
						blueprint={$compassStore.mission}
						why={$compassStore.human_impact}
						tip={$compassStore.pro_tips?.[0] ||
							"Take it one step at a time."}
						backLink="/"
					/>
				</div>
			{/if}

			<!-- Main Content Wrapper -->
			<div
				class="flex-1 ml-0 lg:ml-0 flex flex-col min-w-0 relative {isDashboardRoute
					? 'bg-transparent'
					: 'bg-background'}"
			>
				<!-- Mobile Header -->
				<header
					class="lg:hidden sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between {isDarkHeader
						? 'bg-primary-deep border-white/10'
						: 'bg-background border-border'}"
				>
					<div class="flex items-center gap-3">
						<button aria-label="Menu"
							class="p-2 -ml-2 rounded-lg {isDarkHeader
								? 'text-white/80 hover:bg-white/10'
								: 'text-muted-foreground hover:bg-muted'}"
							onclick={toggleSidebar}
						>
							<Menu class="w-6 h-6" />
						</button>
						<span
							class="font-semibold {isDarkHeader
								? 'text-white'
								: 'text-foreground'}">Continuum</span
						>
					</div>

					<a aria-label="Settings"
						href="/settings"
						class="p-2 rounded-lg {isDarkHeader
							? 'text-white/80 hover:bg-white/10'
							: 'text-muted-foreground hover:bg-muted'}"
					>
						<Settings class="w-5 h-5" />
					</a>
				</header>

				<!-- Glass Header (Desktop) -->
				{#if !isFocusMode}
					<header
						class="hidden lg:flex sticky top-0 z-40 h-20 px-8 items-center justify-between border-b transition-all {isDarkHeader
							? 'bg-primary-deep border-white/10'
							: 'bg-background border-border'}"
					>
						<!-- Breadcrumbs / Page Title -->
						<div
							class="flex items-center gap-2 text-sm {isDarkHeader
								? 'text-white/70'
								: 'text-muted-foreground'}"
						>
							<span
								class="uppercase tracking-wider font-semibold text-xs {isDarkHeader
									? 'text-white/70'
									: 'text-muted-foreground'}"
								>{$dict.groupOverview || "Estate Overview"}</span
							>
							<ChevronRight
								size={14}
								class={isDarkHeader
									? "text-white/70"
									: "text-muted-foreground"}
							/>
							<span
								data-testid="breadcrumb-title"
								class="font-serif font-medium text-lg {isDarkHeader
									? 'text-white'
									: 'text-foreground'}"
							>
								{breadcrumbTitle}
							</span>
						</div>

						<!-- Header Actions -->
						<div class="flex items-center gap-6">
							<!-- Take a Break Button (on the dark header its icon goes light) -->
							<span
								class="contents {isDarkHeader
									? '[&>button]:text-white/80 [&>button:hover]:text-white [&>button:hover]:bg-white/10'
									: ''}"
							>
								<TakeBreakButton variant="icon-only" />
							</span>

							<!-- Context-Aware Role Switcher -->
							<RoleSwitcher dark={isDarkHeader} />

							<!-- Color Picker (Top Menu) -->
							<div
								class="flex items-center gap-1.5 px-2 py-1 rounded-lg border {isDarkHeader
									? 'bg-white/10 border-white/20'
									: 'bg-muted border-border'}"
							>
								<div
									class="w-3 h-3 rounded-full shrink-0 border border-white/30 bg-primary"
								></div>
								<select
									aria-label="Accent Color"
									value={$accessibilityStore.color}
									onchange={(e) =>
										accessibilityStore.setColor(
											e.currentTarget.value as any,
										)}
									class="bg-transparent text-[10px] font-bold uppercase tracking-tight outline-none cursor-pointer transition-colors border-none p-0 pr-1 focus:ring-0 min-w-0 {isDarkHeader
										? 'text-white/80 hover:text-white'
										: 'text-muted-foreground hover:text-foreground'}"
								>
									<option value="teal">🟢 Teal</option>
									<option value="indigo">🔵 Indigo</option>
									<option value="emerald">💚 Emerald</option>
									<option value="rose">🩷 Rose</option>
									<option value="amber">🟠 Amber</option>
									<option value="carbon">⚫ Carbon</option>
								</select>
							</div>

							<!-- Language Selector (Top Menu) -->
							<div
								class="flex items-center gap-1.5 px-2 py-1 rounded-lg border max-w-[100px] {isDarkHeader
									? 'bg-white/10 border-white/20'
									: 'bg-muted border-border'}"
							>
								<Globe
									size={14}
									class="{isDarkHeader
										? 'text-white/70'
										: 'text-muted-foreground'} shrink-0"
								/>
								<select
									aria-label={$dict.labelLanguages}
									value={$language}
									onchange={(e) =>
										language.set(
											e.currentTarget.value as any,
										)}
									class="bg-transparent text-[10px] font-bold uppercase tracking-tight outline-none cursor-pointer transition-colors border-none p-0 pr-1 focus:ring-0 min-w-0 {isDarkHeader
										? 'text-white/80 hover:text-white'
										: 'text-muted-foreground hover:text-foreground'}"
								>
									<option value="en">🇺🇸 EN</option>
									<option value="es">🇪🇸 ES</option>
									<option value="fr">🇫🇷 FR</option>
									<option value="de">🇩🇪 DE</option>
									<option value="ru">🇷🇺 RU</option>
									<option value="he">🇮🇱 HE</option>
								</select>
							</div>

							<!-- AI Concierge Trigger -->
							<button
								onclick={() => conciergeEngine.open()}
								class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border {isDarkHeader
									? 'bg-white/10 text-white hover:bg-white/20 border-white/30'
									: 'bg-primary-soft text-primary-hover hover:bg-primary/15 border-primary/20'}"
								title="Open AI Concierge"
							>
								<Sparkles size={18} />
								<span class="text-sm font-bold hidden sm:inline"
									>AI Concierge</span
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
								class="text-[10px] font-bold uppercase tracking-[0.2em] text-gold"
							>
								Construction Active
							</div>
							<div
								class="h-1 w-1 rounded-full bg-gold animate-pulse"
							></div>
						</div>
						<GodModeToggle />
					</header>
				{/if}

				<main id="main-content" tabindex="-1" class="flex-1 overflow-x-hidden outline-none pb-20 lg:pb-6">
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

		<!-- Mobile Bottom Navigation -->
		{#if !isFocusMode}
			<MobileBottomNav />
		{/if}
	</div>
{/if}

{#if showCommandCenter}
	<CommandCenter onclose={() => (showCommandCenter = false)} />
{/if}

<ConciergePanel
	isOpen={$conciergeEngine.isOpen}
	onClose={() => conciergeEngine.close()}
/>

{#if $overwhelmState.isOverwhelmed}
	<BreakOffer signals={$overwhelmState.signals} />
{/if}

{#if $magicTrigger}
	<SuccessParticles />
{/if}
