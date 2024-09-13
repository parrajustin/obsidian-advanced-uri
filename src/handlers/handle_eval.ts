import type AdvancedURI from "../main";
import type { OpenFileParams } from "./handler_utils";
import { OpenFileHandler } from "./handler_utils";
import type { StatusResult } from "../lib/result";
import { Err, Ok } from "../lib/result";
import type { StatusError } from "../lib/status_error";
import { PermissionDeniedError } from "../lib/status_error";

/** URI params for eval execution. */
export interface EvalUriParams extends OpenFileParams {
    type: "eval";
    /** The js to evaluate. */
    eval: string;
}

/** Handles evaluation `eval` of JS uri. */
export async function HandleEval(
    parameters: EvalUriParams,
    pluginClass: AdvancedURI
): Promise<StatusResult<StatusError>> {
    // Handles opening the file for evaluation of JS.
    const openFileHandlerResult = await OpenFileHandler(parameters, pluginClass);
    if (openFileHandlerResult.err) {
        return openFileHandlerResult;
    }

    if (!pluginClass.settings.allowEval) {
        return Err(PermissionDeniedError("Settings disallow eval."));
    }

    //Call eval in a global scope
    const eval2 = eval;
    eval2(parameters.eval);
    return Ok();
}
