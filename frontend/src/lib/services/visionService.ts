export type AnalyzedHeirloom = {
    name: string;
    description: string;
    estimatedValue?: string;
    category?: string;
    confidence: number;
};

const MOCK_ANALYSES: Record<string, AnalyzedHeirloom> = {
    default: {
        name: "Vintage Rolex Submariner",
        description: "A classic diver's watch, likely from the late 1980s. Features the iconic black dial and rotating bezel. Appears to be in good condition with original bracelet.",
        estimatedValue: "$8,500 - $12,000",
        category: "Watches",
        confidence: 0.92,
    },
    watch: {
        name: "Omega Speedmaster Professional",
        description: "The 'Moonwatch'. Chronograph with tachymeter scale. Stainless steel case. Looks like a manual wind movement based on the case thickness.",
        estimatedValue: "$5,000 - $7,500",
        category: "Watches",
        confidence: 0.95,
    },
    camera: {
        name: "Leica M6 Rangefinder",
        description: "Classic 35mm rangefinder camera. Black chrome finish. Paired with what looks like a Summicron 50mm lens.",
        estimatedValue: "$3,200 - $4,500",
        category: "Cameras",
        confidence: 0.88,
    }
};

export async function analyzeAssetImage(file: File): Promise<AnalyzedHeirloom> {
    return analyzeHeirloomImage(file);
}

export async function analyzeHeirloomImage(file: File): Promise<AnalyzedHeirloom> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple deterministic mock based on file size or name just to vary it slightly if needed, 
    // but mainly return the default or specific types for demo.

    if (file.name.toLowerCase().includes('watch')) {
        return MOCK_ANALYSES.watch;
    }
    if (file.name.toLowerCase().includes('camera')) {
        return MOCK_ANALYSES.camera;
    }

    return MOCK_ANALYSES.default;
}
