import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { topics } from '@/lib/topics';
import { features } from '@/lib/features';

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it.each(topics)('opens a dedicated topic page for $slug', topic => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(`/topics/${topic.slug}`);
    expect(matches.at(-1)?.routeId).toBe('/topics/$topicId');
    expect(matches.at(-1)?.params).toMatchObject({ topicId: topic.slug });
  });
  it.each(features)('opens a dedicated workspace for the $slug feature', feature => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(`/features/${feature.slug}`);
    expect(matches.at(-1)?.routeId).toBe('/features/$featureId');
    expect(matches.at(-1)?.params).toMatchObject({ featureId: feature.slug });
  });
  it('matches the dedicated workspace without mounting the task-list page', () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes('/tasks/example');
    expect(matches.at(-1)?.routeId).toBe('/tasks_/$taskId');
    expect(matches.some(match => match.routeId === '/tasks')).toBe(false);
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
