// --- Logic Helpers ---

// Helper to find data recursively
function findSubChapterRecursive(subChapters, targetId) {
    for (const sub of subChapters) {
        if (sub.id === targetId) return sub;
        if (sub.subChapters && sub.subChapters.length > 0) {
            const found = findSubChapterRecursive(sub.subChapters, targetId);
            if (found) return found;
        }
    }
    return null;
}

function findActiveData() {
    const formation = formations.find(f => f.id === activeFormationId);
    if (!formation) return null;

    const path = [formation];
    let activeItem = formation;

    const module = formation.modules.find(m => m.id === activeModuleId);
    if (module) {
        path.push(module);
        activeItem = module;

        const chapter = module.chapters.find(c => c.id === activeChapterId);
        if (chapter) {
            path.push(chapter);
            activeItem = chapter;

            // Recursive search for sub-chapter
            if (activeSubId) {
                // Helper to find sub and build path
                function findSubAndPath(subs, targetId, currentPath) {
                    for (const sub of subs) {
                        if (sub.id === targetId) {
                            return { found: sub, path: [...currentPath, sub] };
                        }
                        if (sub.subChapters && sub.subChapters.length > 0) {
                            const result = findSubAndPath(sub.subChapters, targetId, [...currentPath, sub]);
                            if (result) return result;
                        }
                    }
                    return null;
                }

                const result = findSubAndPath(chapter.subChapters, activeSubId, []);
                if (result) {
                    path.push(...result.path);
                    activeItem = result.found;
                }
            }
        }
    }

    return { formation, module, chapter: path.find(p => p.chapters), sub: activeItem, activeItem, path };
}
