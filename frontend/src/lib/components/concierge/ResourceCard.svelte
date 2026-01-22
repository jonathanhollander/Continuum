<script lang="ts">
    import { BookOpen, Play, Wrench, ExternalLink } from "lucide-svelte";

    export let title: string;
    export let description: string;
    export let link: string;
    export let type: "article" | "video" | "tool" = "article";

    const icons = {
        article: BookOpen,
        video: Play,
        tool: Wrench,
    };
</script>

<a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    class="resource-card group"
>
    <div class="icon-container">
        <svelte:component this={icons[type]} size={20} />
    </div>
    <div class="content">
        <h4 class="title">{title}</h4>
        <p class="description">{description}</p>
    </div>
    <div class="action">
        <ExternalLink size={16} />
    </div>
</a>

<style>
    .resource-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        margin-top: 0.5rem;
        text-decoration: none;
        transition: all 0.2s ease;
        max-width: 100%;
    }

    .resource-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
    }

    .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        color: #e5e7eb;
        flex-shrink: 0;
    }

    .content {
        flex: 1;
        overflow: hidden;
    }

    .title {
        font-size: 0.9rem;
        font-weight: 500;
        color: #f3f4f6;
        margin: 0 0 0.125rem 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .description {
        font-size: 0.8rem;
        color: #9ca3af;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .action {
        color: #6b7280;
        transition: color 0.2s ease;
    }

    .resource-card:hover .action {
        color: #f3f4f6;
    }
</style>
