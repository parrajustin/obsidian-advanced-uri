import type { App } from "obsidian";
import { MarkdownView } from "obsidian";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";
import type { StatusError } from "../lib/status_error";
import { NotFoundError } from "../lib/status_error";

/** `setCursorInLine` function params. */
export interface SetCursorInLineParams {
    /** The line to set the cursor to. If undefined selects the line the cursor is on. */
    line?: number;
    /** The column to select, if empty selects the last one. */
    column?: number;
    /** Optional offset from the line to column. */
    offset?: number;
    viewmode?: "preview";
}

/** Sets the cursor in a line in the current markdown file. */
export async function SetCursorInLine(
    parameters: SetCursorInLineParams,
    app: App
): Promise<StatusResult<StatusError>> {
    const view = app.workspace.getActiveViewOfType<MarkdownView>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MarkdownView as any
    );
    if (view === null) {
        return Err(NotFoundError("Could not find any active view of markdown."));
    }
    const viewState = view.leaf.getViewState();

    const rawLine = parameters.line != undefined ? Number(parameters.line) : undefined;
    const rawColumn = parameters.column != undefined ? Number(parameters.column) : 1;
    viewState.state.mode = "source";
    await view.leaf.setViewState(viewState);

    let line: number;
    let column: number;
    if (parameters.offset != undefined) {
        const pos = view.editor.offsetToPos(Number(parameters.offset));
        line = pos.line;
        column = pos.ch;
    } else {
        line =
            rawLine != undefined
                ? Math.min(rawLine - 1, view.editor.lineCount() - 1)
                : view.editor.getCursor().line;
        const maxColumn = view.editor.getLine(line).length - 1;
        column = Math.min(rawColumn - 1, maxColumn);
    }
    view.editor.focus();
    view.editor.setCursor({
        line: line,
        ch: column
    });
    view.editor.scrollIntoView(
        {
            from: { line: line, ch: column },
            to: { line: line, ch: column }
        },
        true
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    if (parameters.viewmode === "preview") {
        viewState.state.mode = "preview";
        await view.leaf.setViewState(viewState);
    }
    return Ok();
}
