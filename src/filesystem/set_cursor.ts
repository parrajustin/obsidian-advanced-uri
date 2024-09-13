import type { App } from "obsidian";
import { MarkdownView } from "obsidian";
import type { ModeTypes } from "src/types";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";
import type { StatusError } from "../lib/status_error";
import { NotFoundError } from "../lib/status_error";

export interface SetCursorParams {
    mode?: ModeTypes;
    viewmode?: "preview";
}

/** Moves the cursor to either the start or end of the current file. */
export async function SetCursor(
    params: SetCursorParams,
    app: App
): Promise<StatusResult<StatusError>> {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
        return Err(NotFoundError("Could not find any active view of markdown."));
    }
    const mode = params.mode;
    const editor = view.editor;

    const viewState = view.leaf.getViewState();
    viewState.state.mode = "source";

    if (mode === "append") {
        const lastLine = editor.lastLine();
        const lastLineLength = editor.getLine(lastLine).length;
        await view.leaf.setViewState(viewState, { focus: true });

        editor.setCursor({ ch: lastLineLength, line: lastLine });
    } else if (mode === "prepend") {
        await view.leaf.setViewState(viewState, { focus: true });

        editor.setCursor({ ch: 0, line: 0 });
    }

    // wait a bit of time to set the view state.
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (params.viewmode == "preview") {
        viewState.state.mode = "preview";
        await view.leaf.setViewState(viewState);
    }
    return Ok();
}
