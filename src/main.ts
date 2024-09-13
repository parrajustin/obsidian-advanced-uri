import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, URI_LINK } from "./constants";
import { CommandModal } from "./modals/command_modal";
import { FileModal } from "./modals/file_modal";
import { ReplaceModal } from "./modals/replace_modal";
import { SearchModal } from "./modals/search_modal";
import { SettingsTab } from "./settings";
import Tools from "./tools";
import type {
    AdvancedURISettings,
    EmitEventParams,
    FileModalData,
    MultiCommandParams,
    Parameters,
    SearchModalData
} from "./types";
import { Err, Ok, type StatusResult } from "./lib/result";
import { InvalidArgumentError, NotFoundError, type StatusError } from "./lib/status_error";
import {
    HandleCommand,
    HandleEval,
    HandleFrontmatterKey,
    HandleOpen,
    HandleOpenBlock,
    HandlePluginManagement,
    HandleWrite
} from "./handlers/index";
import { EnterDataModal } from "./modals/enter_data_modal";

export interface ForeignHandlerRegister {
    // Name for the handler.
    type: string;
    // The description of the handler.
    desc: string;
    // Callback function handler.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    func: (params: any) => Promise<{ ok: boolean; err?: string }>;
}

export interface ForeignHandlerEntry {
    // Data passed from the foreign handler.
    data: ForeignHandlerRegister;
    // If this handler is enabled.
    enabled: boolean;
}

/**
 * The plugin main class.
 */
export default class AdvancedURI extends Plugin {
    settings: AdvancedURISettings;
    tools = new Tools(this);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public registeredHandlers = new Set<ForeignHandlerEntry>();

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this));

        this.addCommand({
            id: "copy-uri-file",
            name: "Copy URI for file",
            callback: () => {
                const fileModal = new FileModal(this, "Choose a file", /*allowNoFile=*/ false);
                fileModal.open();
                fileModal.onChooseItem = (item) => {
                    new EnterDataModal(this, item.source).open();
                };
            }
        });

        this.addCommand({
            id: "copy-uri-current-file",
            name: "Copy URI for current file",
            callback: () => {
                const view = this.app.workspace.getActiveViewOfType<MarkdownView>(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    MarkdownView as any
                );
                if (view === null) {
                    return;
                }
                const file = view.file;
                if (file === null) {
                    return;
                }
                new EnterDataModal(this, file.path).open();
            }
        });

        // this.addCommand({
        //     id: "copy-uri-daily",
        //     name: "Copy URI for daily note",
        //     callback: () => new EnterDataModal(this).open()
        // });

        this.addCommand({
            id: "copy-uri-search-and-replace",
            name: "Copy URI for search and replace",
            callback: () => {
                const fileModal = new FileModal(this, "Used file for search and replace");
                fileModal.open();
                fileModal.onChooseItem = (filePath: FileModalData) => {
                    const searchModal = new SearchModal(this);
                    searchModal.open();
                    searchModal.onChooseSuggestion = (item: SearchModalData) => {
                        new ReplaceModal(this, item, filePath?.source).open();
                    };
                };
            }
        });

        this.addCommand({
            id: "copy-uri-command",
            name: "Copy URI for command",
            callback: () => {
                const fileModal = new FileModal(
                    this,
                    "Select a file to be opened before executing the command"
                );
                fileModal.open();
                fileModal.onChooseItem = (item: FileModalData) => {
                    new CommandModal(this, item?.source).open();
                };
            }
        });

        // this.addCommand({
        //     id: "copy-uri-block",
        //     name: "Copy URI for current block",
        //     checkCallback: (checking) => {
        //         const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        //         if (checking) return view != undefined;
        //         const id = BlockUtils.getBlockId(this.app);
        //         if (id) {
        //             this.tools.copyURI({
        //                 filepath: view.file.path,
        //                 block: id
        //             });
        //         }
        //     }
        // });

        // New version starting with v1.44.0
        this.registerObsidianProtocolHandler(URI_LINK, async (e) => {
            const parameters = e as unknown as Parameters;
            console.log("registerObsidianProtocolHandler", parameters);

            // this.onUriCall(parameters);
        });

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file, source) => {
                if (
                    !(
                        source === "more-options" ||
                        source === "tab-header" ||
                        source == "file-explorer-context-menu"
                    )
                ) {
                    return;
                }

                if (!(file instanceof TFile)) {
                    return;
                }

                menu.addItem((item) => {
                    item.setTitle(`Copy Advanced URI`)
                        .setIcon("link")
                        .setSection("info")
                        .onClick(() => {
                            new EnterDataModal(this, file.path).open();
                        });
                });
            })
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callback: any = (data: ForeignHandlerRegister) => {
            if (data.desc === undefined || data.func === undefined || data.type === undefined) {
                return;
            }
            const isEnabled = this.settings.enabledForeignTypes.contains(data.type);
            console.log("adding ForeignHandler", data, `is enabled "${isEnabled}".`);
            this.registeredHandlers.add({ data, enabled: isEnabled });
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.registerEvent(this.app.workspace.on("register-foreign-handler" as any, callback));
    }

    /**
     * Executes the handler based on the input parameter.
     * @param parameters handler parameters
     * @returns status of the execution
     */
    async executeHandler(parameters: Parameters): Promise<StatusResult<StatusError>> {
        let statusResult: StatusResult<StatusError> | undefined;
        switch (parameters.type) {
            case "command": {
                statusResult = await HandleCommand(parameters, this);
                break;
            }
            case "eval": {
                statusResult = await HandleEval(parameters, this);
                break;
            }
            case "frontmatter": {
                statusResult = HandleFrontmatterKey(parameters, this);
                break;
            }
            case "open-block": {
                statusResult = await HandleOpenBlock(parameters, this);
                break;
            }
            case "open": {
                statusResult = await HandleOpen(parameters, this);
                break;
            }
            case "plugin": {
                HandlePluginManagement(parameters, this);
                break;
            }
            case "write": {
                statusResult = await HandleWrite(parameters, this);
                break;
            }
            case "multi": {
                statusResult = await this.executeMultiHandler(parameters);
                break;
            }
            case "event": {
                this.executeEventHandler(parameters);
                break;
            }
            default: {
                let foundHandler: ForeignHandlerEntry | undefined;
                for (const handler of this.registeredHandlers) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (handler.enabled && handler.data.type === (parameters as any).type) {
                        foundHandler = handler;
                        break;
                    }
                }
                if (foundHandler !== undefined) {
                    foundHandler?.data.func(parameters);
                    break;
                }

                statusResult = Err(
                    NotFoundError(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        `Handler for type "${(parameters as any).type}" not found. ${JSON.stringify(parameters)}`
                    )
                );
            }
        }

        if (statusResult !== undefined && statusResult.err) {
            // eslint-disable-next-line no-console
            console.error(statusResult.val.toString());
            new Notice(statusResult.val.toString());
            return statusResult;
        }
        return Ok();
    }

    executeEventHandler(parameters: EmitEventParams) {
        this.app.workspace.trigger(parameters.eventName, parameters);
    }

    /**
     * Executes a multi handler.
     * @param parameters params
     * @returns result of status
     */
    async executeMultiHandler(parameters: MultiCommandParams): Promise<StatusResult<StatusError>> {
        const data = JSON.parse(decodeURIComponent(parameters.comamnds)) as Parameters[];
        if (!(data instanceof Array)) {
            return Err(InvalidArgumentError(`Failed to parse "${parameters.comamnds}" as array.`));
        }

        for (const command of data) {
            const result = await this.executeHandler(command);
            if (result.err) {
                return result;
            }
        }
        return Ok();
    }

    async loadSettings() {
        this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
