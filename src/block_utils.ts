import type { App, Editor, ListItemCache, SectionCache, TFile } from "obsidian";
import { MarkdownView } from "obsidian";

export function GetBlock(
    app: App,
    editor: Editor,
    file: TFile
): (SectionCache | ListItemCache) | undefined {
    const cursor = editor.getCursor("to");
    const fileCache = app.metadataCache.getFileCache(file);
    const sections = fileCache?.sections;
    if (!sections || sections.length === 0) {
        console.log("error reading FileCache (empty file?)");
        return;
    }
    const foundSectionIndex = sections.findIndex(
        (section) => section.position.start.line > cursor.line
    );
    let currentBlock: SectionCache | ListItemCache | undefined =
        foundSectionIndex > 0 ? sections[foundSectionIndex - 1] : sections[sections.length - 1];
    if (currentBlock?.type == "list") {
        currentBlock =
            fileCache.listItems?.find(
                (section) =>
                    section.position.start.line <= cursor.line &&
                    section.position.end.line >= cursor.line
            ) ?? currentBlock;
    }
    return currentBlock;
}

export function GetIdOfBlock(editor: Editor, block: SectionCache | ListItemCache): string {
    const blockId = block.id;

    if (blockId !== undefined) {
        return blockId;
    }

    // Add a block id
    const sectionEnd = block.position.end;
    const pos = {
        ch: sectionEnd.col,
        line: sectionEnd.line
    };

    const newId = Math.random().toString(36).substring(2, 8);
    const spacer = ShouldInsertAfter(block) ? "\n\n" : " ";

    editor.replaceRange(`${spacer}^${newId}`, pos);
    return newId;
}

export function ShouldInsertAfter(block: SectionCache | ListItemCache): boolean {
    if (block.type) {
        return ["blockquote", "code", "table", "heading", "comment", "footnoteDefinition"].includes(
            block.type
        );
    }

    return false;
}

export function GetBlockId(app: App): string | undefined {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
        const editor = view.editor;
        const file = view.file;
        if (!file) {
            return;
        }
        const block = GetBlock(app, editor, file);
        if (block) return GetIdOfBlock(editor, block);
    }
    return;
}
