import type { App, WorkspaceLeaf } from "obsidian";
import { MarkdownView, Platform, TFile } from "obsidian";
import type { OpenMode } from "../types";
import { getViewStateFromMode } from "../utils";
import type { StatusError } from "../lib/status_error";
import { InternalError, InvalidArgumentError } from "../lib/status_error";
import type { Result } from "../lib/result";
import { Err, Ok } from "../lib/result";
import { None, Some, type Option } from "../lib/option";

export interface OpenParams {
    file?: string | TFile;
    setting?: boolean;
    parameters: {
        openmode?: OpenMode;
        filepath?: string;
    };
    supportPopover?: boolean;
    mode?: "source";
}

/** Opens a file and contains ability to control open mode. */
export async function OpenFile(
    { file, setting, parameters, supportPopover, mode }: OpenParams,
    app: App
): Promise<Result<WorkspaceLeaf, StatusError>> {
    let leaf: Option<WorkspaceLeaf> = None;
    if (parameters.openmode == "popover" && (supportPopover ?? true)) {
        const hoverEditor = app.plugins.plugins["obsidian-hover-editor"];
        if (!hoverEditor) {
            return Err(InternalError("The hover editor internal plugin not found!"));
        }

        await new Promise<void>((resolve) => {
            leaf = Some(
                hoverEditor.spawnPopover(undefined, () => {
                    if (leaf.some) {
                        app.workspace.setActiveLeaf(leaf.safeValue(), { focus: true });
                    }
                    resolve();
                })
            );
        });
    } else {
        let openMode: OpenMode | boolean | undefined = setting;
        if (parameters.openmode !== undefined) {
            if (parameters.openmode == "true" || parameters.openmode == "false") {
                openMode = parameters.openmode == "true";
            } else if (parameters.openmode == "popover") {
                openMode = false;
            } else if (Platform.isMobile && parameters.openmode == "window") {
                // Intentianally empty.
            } else {
                openMode = parameters.openmode;
            }
        }
        if (openMode == "silent") {
            return Err(InvalidArgumentError('`openmode` set to "silent"'));
        }

        // `window` is only supported on desktop
        if (Platform.isMobileApp && openMode == "window") {
            openMode = true;
        }

        if (file != undefined) {
            let fileIsAlreadyOpened = false;
            if (isBoolean(openMode)) {
                app.workspace.iterateAllLeaves((existingLeaf: WorkspaceLeaf) => {
                    if (existingLeaf.view.file?.path === parameters.filepath) {
                        if (fileIsAlreadyOpened) {
                            return;
                        }
                        fileIsAlreadyOpened = true;

                        app.workspace.setActiveLeaf(existingLeaf, {
                            focus: true
                        });
                        leaf = Some(existingLeaf);
                    }
                });
            }
        }
        if (leaf.none) {
            leaf = Some(app.workspace.getLeaf(openMode));
            app.workspace.setActiveLeaf(leaf.safeValue(), { focus: true });
        }
    }

    if (leaf.none) {
        return Err(InternalError(`Failed to open file in leaf.`));
    }

    if (file instanceof TFile) {
        await leaf.safeValue().openFile(file);
    } else if (file != undefined) {
        await app.workspace.openLinkText(
            file,
            "/",
            false,
            mode != undefined ? { state: { mode: mode } } : getViewStateFromMode(parameters)
        );
    }

    if (leaf.safeValue().view instanceof MarkdownView) {
        const viewState = leaf.safeValue().getViewState();
        if (mode != undefined) {
            viewState.state.mode = mode;
        } else {
            viewState.state = {
                ...viewState.state,
                ...getViewStateFromMode(parameters)?.state
            };
        }
        await leaf.safeValue().setViewState(viewState);
    }

    return Ok(leaf.safeValue());
}
