import type AdvancedURI from "src/main";
import type { OpenFileParams } from "./handler_utils";
import { OpenFileHandler } from "./handler_utils";
import type { StatusResult } from "../lib/result";
import { Ok } from "../lib/result";
import type { StatusError } from "../lib/status_error";

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
    if (parameters.commandid) {
        this.app.commands.executeCommandById(parameters.commandid);
    } else if (parameters.commandname) {
        const rawCommands = this.app.commands.commands;
        for (const command in rawCommands) {
            if (rawCommands[command].name === parameters.commandname) {
                if (rawCommands[command].callback) {
                    await rawCommands[command].callback();
                } else {
                    rawCommands[command].checkCallback(false);
                }
                break;
            }
        }
    }

    if (parameters.confirm && parameters.confirm != "false") {
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
