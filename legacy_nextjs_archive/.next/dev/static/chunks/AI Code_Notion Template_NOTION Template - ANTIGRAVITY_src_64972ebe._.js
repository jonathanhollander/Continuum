(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivingBlueprintHeader",
    ()=>LivingBlueprintHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function LivingBlueprintHeader({ title, subtitle, tier = "preparation", className, ...props }) {
    // Grid Pattern Definition
    const GridPattern = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "absolute inset-0 size-full opacity-20",
            "aria-hidden": "true",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                        id: "blueprint-grid",
                        width: "40",
                        height: "40",
                        patternUnits: "userSpaceOnUse",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: "M0 40L40 0H20L0 20M40 40V20L20 40",
                            stroke: "currentColor",
                            strokeWidth: "0.5",
                            fill: "none"
                        }, void 0, false, {
                            fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                            lineNumber: 31,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                        lineNumber: 25,
                        columnNumber: 17
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                    lineNumber: 24,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    width: "100%",
                    height: "100%",
                    fill: "url(#blueprint-grid)"
                }, void 0, false, {
                    fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                    lineNumber: 39,
                    columnNumber: 13
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
            lineNumber: 23,
            columnNumber: 9
        }, this);
    // Architectural Lines Animation
    const draw = {
        hidden: {
            pathLength: 0,
            opacity: 0
        },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: {
                    delay: 0.5,
                    duration: 1.5,
                    ease: "easeInOut"
                }
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative overflow-hidden bg-background text-foreground border-b border-border py-24", "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] before:opacity-5", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 pointer-events-none text-muted-foreground/30",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GridPattern, {}, void 0, false, {
                    fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                    lineNumber: 64,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                lineNumber: 63,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].svg, {
                viewBox: "0 0 100 100",
                className: "absolute top-0 right-0 size-64 text-primary/20 pointer-events-none",
                initial: "hidden",
                animate: "visible",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].rect, {
                        x: "10",
                        y: "10",
                        width: "80",
                        height: "80",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "1",
                        variants: draw
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                        lineNumber: 74,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].line, {
                        x1: "10",
                        y1: "10",
                        x2: "90",
                        y2: "90",
                        stroke: "currentColor",
                        strokeWidth: "0.5",
                        variants: draw
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                        lineNumber: 79,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].line, {
                        x1: "90",
                        y1: "10",
                        x2: "10",
                        y2: "90",
                        stroke: "currentColor",
                        strokeWidth: "0.5",
                        variants: draw
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                        lineNumber: 84,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                lineNumber: 68,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container relative z-10 px-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-3xl space-y-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            duration: 0.8,
                            ease: "easeOut"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-blueprint text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-8 h-[1px] bg-border"
                                    }, void 0, false, {
                                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                                        lineNumber: 101,
                                        columnNumber: 29
                                    }, this),
                                    tier,
                                    " Module"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                                lineNumber: 100,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "font-serif text-5xl md:text-6xl font-bold tracking-tight text-primary",
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                                lineNumber: 106,
                                columnNumber: 25
                            }, this),
                            subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-sans text-xl text-muted-foreground mt-4 max-w-xl leading-relaxed",
                                children: subtitle
                            }, void 0, false, {
                                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                                lineNumber: 112,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                        lineNumber: 94,
                        columnNumber: 21
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                    lineNumber: 93,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                lineNumber: 92,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            }, void 0, false, {
                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
                lineNumber: 121,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/living-blueprint-header.tsx",
        lineNumber: 54,
        columnNumber: 9
    }, this);
}
_c = LivingBlueprintHeader;
var _c;
__turbopack_context__.k.register(_c, "LivingBlueprintHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/reveal-transition.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RevealTransition",
    ()=>RevealTransition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
"use client";
;
;
function RevealTransition({ children, delay = 0, type = "vault" }) {
    // "Vault" Effect: Circular Reveal
    const vaultVariants = {
        hidden: {
            clipPath: "circle(0% at 50% 50%)",
            opacity: 0
        },
        visible: {
            clipPath: "circle(150% at 50% 50%)",
            opacity: 1,
            transition: {
                duration: 1.2,
                ease: [
                    0.22,
                    1,
                    0.36,
                    1
                ],
                delay: delay
            }
        }
    };
    // "Blueprint" Effect: Unfolding from top
    const blueprintVariants = {
        hidden: {
            height: 0,
            opacity: 0,
            borderBottom: "1px solid transparent"
        },
        visible: {
            height: "auto",
            opacity: 1,
            borderBottom: "1px solid var(--border)",
            transition: {
                duration: 0.8,
                ease: "easeInOut",
                delay: delay
            }
        }
    };
    const variants = type === "vault" ? vaultVariants : blueprintVariants;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: "hidden",
        whileInView: "visible",
        viewport: {
            once: true,
            margin: "-100px"
        },
        variants: variants,
        className: type === "blueprint" ? "overflow-hidden" : "",
        children: children
    }, void 0, false, {
        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/reveal-transition.tsx",
        lineNumber: 53,
        columnNumber: 9
    }, this);
}
_c = RevealTransition;
var _c;
__turbopack_context__.k.register(_c, "RevealTransition");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Icons",
    ()=>Icons,
    "MechanicalIcon",
    ()=>MechanicalIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function MechanicalIcon({ urgency = "normal", paths, className, ...props }) {
    // Mechanical "Tick" animation
    const tickVariants = {
        normal: {
            opacity: 1,
            rotate: 0
        },
        urgent: {
            opacity: 1,
            rotate: [
                0,
                -5,
                5,
                -5,
                0
            ],
            transition: {
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1
            }
        }
    };
    // Gear rotation simulation
    const gearVariants = {
        hover: {
            rotate: 180,
            transition: {
                duration: 1,
                ease: "anticipate"
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].svg, {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("size-6 text-foreground/80", className),
        whileHover: "hover",
        animate: urgency === "urgent" ? "urgent" : "normal",
        variants: tickVariants,
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].g, {
                variants: gearVariants,
                style: {
                    originX: "50%",
                    originY: "50%"
                },
                children: paths
            }, void 0, false, {
                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                lineNumber: 47,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "12",
                r: "1",
                className: "fill-destructive/20 stroke-none"
            }, void 0, false, {
                fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                lineNumber: 52,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
        lineNumber: 33,
        columnNumber: 9
    }, this);
}
_c = MechanicalIcon;
const Icons = {
    // Vault / Security
    Vault: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MechanicalIcon, {
            ...props,
            paths: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        width: "18",
                        height: "11",
                        x: "3",
                        y: "11",
                        rx: "2",
                        ry: "2"
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                        lineNumber: 63,
                        columnNumber: 17
                    }, void 0),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M7 11V7a5 5 0 0 1 10 0v4"
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                        lineNumber: 64,
                        columnNumber: 17
                    }, void 0)
                ]
            }, void 0, true)
        }, void 0, false, {
            fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
            lineNumber: 61,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0)),
    // Estate / Home
    Estate: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MechanicalIcon, {
            ...props,
            paths: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                        lineNumber: 72,
                        columnNumber: 17
                    }, void 0),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                        points: "9 22 9 12 15 12 15 22"
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                        lineNumber: 73,
                        columnNumber: 17
                    }, void 0)
                ]
            }, void 0, true)
        }, void 0, false, {
            fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
            lineNumber: 70,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0)),
    // Timeline / Clock
    Chronos: (props)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MechanicalIcon, {
            ...props,
            paths: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        cx: "12",
                        cy: "12",
                        r: "10"
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                        lineNumber: 81,
                        columnNumber: 17
                    }, void 0),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI__Code$2f$Notion__Template$2f$NOTION__Template__$2d$__ANTIGRAVITY$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                        points: "12 6 12 12 16 14"
                    }, void 0, false, {
                        fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
                        lineNumber: 82,
                        columnNumber: 17
                    }, void 0)
                ]
            }, void 0, true)
        }, void 0, false, {
            fileName: "[project]/AI Code/Notion Template/NOTION Template - ANTIGRAVITY/src/components/ui/mechanical-icon.tsx",
            lineNumber: 79,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
};
var _c;
__turbopack_context__.k.register(_c, "MechanicalIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=AI%20Code_Notion%20Template_NOTION%20Template%20-%20ANTIGRAVITY_src_64972ebe._.js.map