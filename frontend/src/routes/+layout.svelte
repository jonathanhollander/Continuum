<script lang="ts">
	import { subscribeTemporaryStorage } from "$lib/services/browserStorage";
	import logo from "$lib/assets/logo.png";
	import "../app.css";
	import { page } from "$app/stores";
	import { onMount, setContext, untrack } from "svelte";
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

	import Sidebar from "$lib/components/layout/Sidebar.svelte";
	import MobileBottomNav from "$lib/components/layout/MobileBottomNav.svelte";
	import { navGroups, pulseSubNav, catalogCategories } from "$lib/config/navigation";
	import NotificationContainer from "$lib/components/NotificationContainer.svelte";
	import RoleSwitcher from "$lib/components/RoleSwitcher.svelte";
	import { contextStore } from "$lib/stores/contextStore.svelte";
	import TakeBreakButton from "$lib/components/TakeBreakButton.svelte";
	import MediaMigrationNotice from "$lib/components/MediaMigrationNotice.svelte";
	import { accessibilityStore } from "$lib/stores/accessibilityStore";
	import { accessStatus, refreshAccessStatus } from "$lib/services/accessStatus";

	let { children } = $props();

	let isSidebarOpen = $state(false);
	let temporaryStorage = $state(false);
	onMount(() => subscribeTemporaryStorage(value => { temporaryStorage = value; }));

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
		if ($page.error) return $dict.errorPage.crumb;
		if (item) return $language === "en" ? item.label : $dict[item.key] || item.label;
		const own = ($page.data as { title?: string } | undefined)?.title;
		return own || $dict.activeModule;
	});
	let isCompassOpen = $state(false);
	let showCommandCenter = $state(false);

	// When route changes, record the navigation.
	let previousPath = $state<string>("");
	$effect(() => {
		if ($page.url.pathname) {
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
	import { userPreferencesStore } from "$lib/stores/userPreferencesStore.svelte";

	// Derived: Is this the Wizard or Marketing Landing?
	let isWizardRoute = $derived(
		$page.url.pathname.startsWith("/wizard") ||
			$page.url.pathname.startsWith("/start"),
	);
	// Onboarding is full-screen like the wizard (own logo,
	// no sidebar); it stays behind sign-in, so isWizardRoute is left alone.
	let isFullScreenRoute = $derived(
		isWizardRoute ||
			$page.url.pathname === "/onboarding" ||
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
	let isAccessBootstrapRoute = $derived($page.url.pathname === "/login" || $page.url.pathname === "/auth/verify");
	let accessAllowed = $derived($accessStatus.phase === "ready" && $accessStatus.status?.access_allowed === true);

	// Derived: Is this the Dashboard route? (it syncs every module)
	let isDashboardRoute = $derived($page.url.pathname === "/dashboard");


	// Sync Data when Auth is ready
	let lastSyncedToken = $state<string | null>(null);
	$effect(() => {
		// Signed out: forget in-memory records so the next account never sees them.
		if (!$auth.token && !$auth.loading && lastSyncedToken) {
			lastSyncedToken = null;
			clearAll();
		}
		if (accessAllowed && $auth.token && !$auth.loading && $auth.token !== lastSyncedToken && !isRecipientRoute) {
			console.log("[Layout] Auth detected, starting global sync...");
			lastSyncedToken = $auth.token;
			// Card X142: the page's own stores first, the rest a moment later (see syncAll);
			// the dashboard shows every module, so it takes them all at once.
			syncAll({ everything: isDashboardRoute });
			contextStore.refresh();
			estateAudit.runAudit();
			// Initialize overwhelm detector from user preference
			if ($auth.user) {
				overwhelmDetector.initialize(!!$auth.user.overwhelm_muted);
			}
		}
	});

	// Preferences follow identified sign-ins, including a new sign-in that reuses a token.
	// Keep their lifetime separate from the global data-sync token guard.
	$effect(() => {
		const state = $auth;
		if (state.loading || !state.token || !state.isAuthenticated || !state.user) {
			untrack(() => userPreferencesStore.reset());
		} else if (accessAllowed && !isRecipientRoute) {
			untrack(() => userPreferencesStore.init());
		}
	});

	// Update concierge context on route change
	$effect(() => {
		conciergeEngine.setContext($page.url.pathname);
	});

	onMount(() => {
		// Initialize auth store (load token from localStorage, fetch user)
		auth.init();

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
		if (!$auth.loading && accessAllowed) {
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
	<link rel="icon" href="/favicon.ico?v=2" />
	<title>Continuum</title>
</svelte:head>

{#snippet storageNotice()}
    {#if temporaryStorage}
        <aside role="status" class="m-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-foreground">
            Temporary browser storage is in use. Keep this page open for unsaved drafts. Saved account records can be loaded after signing in again.
        </aside>
    {/if}
{/snippet}

<!-- Global Notification Container (appears on ALL pages, including auth) -->
{#if accessAllowed || isAccessBootstrapRoute}<NotificationContainer />{/if}

<!-- Media Migration Notice (prompts IndexedDB → Cloud migration when needed) -->
{#if accessAllowed}<MediaMigrationNotice />{/if}

{#if !isAccessBootstrapRoute && !accessAllowed && $accessStatus.phase !== "loading"}
	<main class="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
		<div class="max-w-lg space-y-6 text-center">
			<h1 class="text-3xl font-serif font-bold">Continuum is private while it is being prepared</h1>
			{#if $accessStatus.phase === "error"}
				<p role="alert" class="text-muted-foreground">Access status is unavailable. Try again when you are ready.</p>
				<button class="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold" onclick={() => refreshAccessStatus()}>Try again</button>
			{/if}
			<a class="block text-primary font-semibold underline" href="/login">Sign in</a>
		</div>
	</main>
{:else if !isAccessBootstrapRoute && ($auth.loading || !accessAllowed)}
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
			{$dict.loadingCredentials}
		</p>
	</div>
{:else if isFullScreenRoute || isMarketingRoute || isAuthRoute}
	<!-- Wizard/Marketing Mode: Full exclusion of standard layout -->
	{@render storageNotice()}
	{@render children()}
{:else}
	<!-- Standard Application Layout -->
	<div
		dir={$language === "he" ? "rtl" : "ltr"}
		class="min-h-screen flex flex-col font-sans bg-background text-foreground"
	>
		<a
			href="#main-content"
			class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-slate-900 focus:shadow-lg focus:ring-2 focus:ring-primary"
			>{$dict.skipToContent}</a
		>
		<GlobalSimBanner />
		<div class="flex flex-1">
			<!-- Mobile Sidebar Overlay -->
			{#if isSidebarOpen}
				<button
					class="fixed inset-0 z-40 lg:hidden backdrop-blur-sm cursor-default w-full h-full border-0 bg-background/80"
					transition:fade={{ duration: 200 }}
					onclick={toggleSidebar}
					aria-label={$dict.closeSidebar}
					onkeydown={(e) => e.key === "Escape" && toggleSidebar()}
				></button>
			{/if}

			<!-- Sidebar (Standard) -->
			<Sidebar
				bind:isOpen={isSidebarOpen}
				onClose={() => (isSidebarOpen = false)}
			/>

			<!-- Main Content Wrapper -->
			<div
				class="flex-1 ml-0 lg:ml-0 flex flex-col min-w-0 relative bg-background"
			>
				<!-- Mobile Header -->
				<header
					class="lg:hidden sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between bg-background border-border"
				>
					<div class="flex items-center gap-3">
						<button aria-label={$dict.menu}
							class="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted"
							onclick={toggleSidebar}
						>
							<Menu class="w-6 h-6" />
						</button>
						<span
							class="font-semibold text-foreground">Continuum</span
						>
					</div>

					<a aria-label={$dict.settings}
						href="/settings"
						class="p-2 rounded-lg text-muted-foreground hover:bg-muted"
					>
						<Settings class="w-5 h-5" />
					</a>
				</header>

				<!-- Glass Header (Desktop) -->
					<header
						class="hidden lg:flex sticky top-0 z-40 h-20 px-8 items-center justify-between border-b transition-all bg-background border-border"
					>
						<!-- Breadcrumbs / Page Title -->
						<div
							class="flex items-center gap-2 text-sm text-muted-foreground"
						>
							<span
								class="uppercase tracking-wider font-semibold text-xs text-muted-foreground"
								>{$dict.groupOverview || "Estate Overview"}</span
							>
							<ChevronRight
								size={14}
								class="text-muted-foreground"
							/>
							<span
								data-testid="breadcrumb-title"
								class="font-serif font-medium text-lg text-foreground"
							>
								{breadcrumbTitle}
							</span>
						</div>

						<!-- Header Actions -->
						<div class="flex items-center gap-6">
							<!-- Take a Break Button -->
							<TakeBreakButton variant="icon-only" />

							<!-- Context-Aware Role Switcher -->
							<RoleSwitcher />

							<!-- Color Picker (Top Menu) -->
							<div
								class="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-muted border-border"
							>
								<div
									class="w-3 h-3 rounded-full shrink-0 border border-white/30 bg-primary"
								></div>
								<select
									aria-label={$dict.accentColor}
									value={$accessibilityStore.color}
									onchange={(e) =>
										accessibilityStore.setColor(
											e.currentTarget.value as any,
										)}
									class="bg-transparent text-[10px] font-bold uppercase tracking-tight outline-none cursor-pointer transition-colors border-none p-0 pr-1 focus:ring-0 min-w-0 text-muted-foreground hover:text-foreground"
								>
									<option value="teal">🟢 {$dict.colors.teal}</option>
									<option value="indigo">🔵 {$dict.colors.indigo}</option>
									<option value="emerald">💚 {$dict.colors.emerald}</option>
									<option value="rose">🩷 {$dict.colors.rose}</option>
									<option value="amber">🟠 {$dict.colors.amber}</option>
									<option value="carbon">⚫ {$dict.colors.carbon}</option>
								</select>
							</div>

							<!-- Language Selector (Top Menu) -->
							<div
								class="flex items-center gap-1.5 px-2 py-1 rounded-lg border max-w-[100px] bg-muted border-border"
							>
								<Globe
									size={14}
									class="text-muted-foreground shrink-0"
								/>
								<select
									aria-label={$dict.labelLanguages}
									value={$language}
									onchange={(e) =>
										language.set(
											e.currentTarget.value as any,
										)}
									class="bg-transparent text-[10px] font-bold uppercase tracking-tight outline-none cursor-pointer transition-colors border-none p-0 pr-1 focus:ring-0 min-w-0 text-muted-foreground hover:text-foreground"
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
								class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border bg-primary-soft text-primary-hover hover:bg-primary/15 border-primary/20"
								title={$dict.openConcierge}
							>
								<Sparkles size={18} />
								<span class="text-sm font-bold hidden sm:inline"
									>{$dict.aiConcierge}</span
								>
							</button>

							<img
								src={logo}
								alt={$dict.logoAlt}
								class="h-8 w-auto"
							/>
						</div>
					</header>

				<main id="main-content" tabindex="-1" class="flex-1 overflow-x-hidden outline-none pb-20 lg:pb-6">
					{@render storageNotice()}
					<div
						class="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full"
					>
						{@render children()}
					</div>
				</main>
			</div>
		</div>

		<!-- Mobile Bottom Navigation -->
		<MobileBottomNav />
	</div>
{/if}

{#if accessAllowed}
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
{/if}
