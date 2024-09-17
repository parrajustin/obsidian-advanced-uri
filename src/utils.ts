import type { App, OpenViewState, TFile } from "obsidian";
import type { StatusError } from "./lib/status_error";
import { InternalError, NotFoundError } from "./lib/status_error";
import type { Result } from "./lib/result";
import { Err, Ok } from "./lib/result";

export function GetViewStateFromMode(parameters: { viewmode?: string }): OpenViewState | undefined {
    return parameters.viewmode !== undefined
        ? {
              state: {
                  mode: parameters.viewmode,
                  source: parameters.viewmode == "source"
              }
          }
        : undefined;
}

/** Sets the clipboard to `text`. */
export function CopyText(text: string) {
    return navigator.clipboard.writeText(text);
}

export function GetAlternativeFilePath(app: App, file: TFile): string {
    const dir = file.parent?.path;
    const formattedDir = dir === "/" ? "" : dir;
    const name = file.name;
    for (let index = 1; index < 100; index++) {
        const base = StripMD(name);
        const alternative = formattedDir + (formattedDir == "" ? "" : "/") + base + ` ${index}.md`;

        const exists = app.vault.getAbstractFileByPath(alternative) !== null;
        if (!exists) {
            return alternative;
        }
    }
    return file.path;
}

export function GetFileUri(app: App, file: TFile): string {
    const url = new URL(app.vault.getResourcePath(file));
    url.host = "localhosthostlocal";
    url.protocol = "file";
    url.search = "";

    url.pathname = decodeURIComponent(url.pathname);
    const res = url.toString().replace("/localhosthostlocal/", "/");
    return res;
}

/**
 * Gets the end and beginning of a heading block.
 * @param app
 * @param file the file to find the heading in
 * @param heading heading text to search for.
 * @returns returns the first and last line of the block for the heading.
 */
export function GetEndAndBeginningOfHeading(
    app: App,
    file: TFile,
    heading: string
): Result<{ lastLine: number; firstLine: number }, StatusError> {
    const cache = app.metadataCache.getFileCache(file);
    if (cache === null) {
        return Err(NotFoundError(`Failed to find cache for "${file.path}".`));
    }
    const foundHeading = cache.headings?.find((e) => e.heading === heading);
    if (!foundHeading) {
        return Err(NotFoundError(`Failed to find heading "${heading}".`));
    }
    const sections = cache.sections;
    if (sections === undefined) {
        return Err(InternalError(`No sections found for "${file.path}".`));
    }

    const foundSectionIndex = sections.findIndex(
        (section) =>
            section.type === "heading" &&
            section.position.start.line === foundHeading.position.start.line
    );
    const restSections = sections.slice(foundSectionIndex + 1);

    const nextHeadingIndex = restSections.findIndex((e) => e.type === "heading");

    const lastSection =
        restSections[(nextHeadingIndex !== -1 ? nextHeadingIndex : restSections.length) - 1] ??
        sections[foundSectionIndex];
    if (lastSection === undefined) {
        return Err(InternalError(`No specific section found.`));
    }
    const lastLine = lastSection.position.end.line + 1;

    return Ok({
        lastLine: lastLine,
        firstLine: sections[foundSectionIndex]?.position.end.line ?? 0 + 1
    });
}

/**
 * Strip '.md' off the end of a note name to get its basename.
 *
 * Works with the edgecase where a note has '.md' in its basename: `Obsidian.md.md`, for example.
 * @param  {string} noteName with or without '.md' on the end.
 * @returns {string} noteName without '.md'
 */
export function StripMD(noteName: string): string {
    if (noteName.match(/\.MD$|\.md$/m)) {
        return noteName
            .split(/\.MD$|\.md$/m)
            .slice(0, -1)
            .join(".md");
    }
    return noteName;
}
