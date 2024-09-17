import type AdvancedURI from "src/main";
import type { OpenFileParams } from "./handler_utils";
import { OpenFileHandler } from "./handler_utils";
import type { StatusResult } from "../lib/result";
import { Ok } from "../lib/result";
import type { StatusError } from "../lib/status_error";
import type { Command } from "obsidian";

/** URI params for command execution. */
export interface CommandUriParams extends OpenFileParams {
    type: "command";
    /** Command full name. */
    commandname?: string;
    /** Command id from source code. */
    commandid?: string;
    /** If to auto confirm. */
    confirm?: string;
}

/** Handles the command execution URI path. */
export async function HandleCommand(
    parameters: CommandUriParams,
    pluginClass: AdvancedURI
): Promise<StatusResult<StatusError>> {
    // Handles opening the file for command execution.
    const openFileHandlerResult = await OpenFileHandler(parameters, pluginClass);
    if (openFileHandlerResult.err) {
        return openFileHandlerResult;
    }

    // Params for command execution.
    if (parameters.commandid != undefined) {
        pluginClass.app.commands.executeCommandById(parameters.commandid);
    } else if (parameters.commandname !== undefined) {
        const rawCommands = pluginClass.app.commands.commands;
        for (const command in rawCommands) {
            const selectedCommand = rawCommands[command] as Command;
            if (selectedCommand.name === parameters.commandname) {
                if (selectedCommand.callback) {
                    await selectedCommand.callback();
                } else if (selectedCommand.checkCallback !== undefined) {
                    selectedCommand.checkCallback(false);
                }
                break;
            }
        }
    }

    if (parameters.confirm !== undefined && parameters.confirm != "false") {
        await new Promise((r) => setTimeout(r, 750));
        const button = document.querySelector(
            ".mod-cta:not([style*='display: none'])"
        ) as HTMLElement;
        if (button.click instanceof Function) {
            button.click();
        }
    }
    return Ok();
}
