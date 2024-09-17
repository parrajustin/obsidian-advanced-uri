import { SuggestModal } from "obsidian";
import type AdvancedURI from "../main";
import type { EnterData } from "../types";

/** A modal to suggest the following write modes into a file. */
export class EnterDataModal extends SuggestModal<EnterData> {
    plugin: AdvancedURI;
    //null if for normal write mode, its not associated with a special mode like "append" or "prepend"
    modes = [null, "overwrite", "append", "prepend"];

    constructor(
        plugin: AdvancedURI,
        private _file: string
    ) {
        super(plugin.app);
        this.plugin = plugin;
        this.setPlaceholder(
            "Type your data to be written to the file or leave it empty to just open it"
        );
    }

    /** Ran everytime text is written into the suggestion view. */
    public getSuggestions(query: string): EnterData[] {
        const suggestions: EnterData[] = [];
        for (const mode of this.modes) {
            if (mode === "overwrite" && query === "") {
                continue;
            }

            /** Text to display in the suggestion view. */
            let display: string;
            if (query === "") {
                if (mode !== null && mode.length > 0) {
                    display = `Write "${query}" in ${mode} mode`;
                } else {
                    display = `Write "${query}"`;
                }
            } else {
                if (mode !== null && mode.length > 0) {
                    display = `Open in ${mode} mode`;
                } else {
                    display = `Open`;
                }
            }

            suggestions.push({
                data: query,
                display: display,
                mode: mode,
                func: () => {
                    if (this._file) {
                        void this.plugin.tools.copyURI({
                            filepath: this._file,
                            data: query,
                            mode: mode,
                            uid: ""
                        });
                    } else {
                        void this.plugin.tools.copyURI({
                            daily: "true",
                            data: query,
                            mode: mode,
                            uid: "",
                            filepath: ""
                        });
                    }
                }
            });
        }

        return suggestions;
    }

    /** What to render for a suggested item. */
    public renderSuggestion(value: EnterData, el: HTMLElement): void {
        el.innerText = value.display;
    }

    /** What to do on suggestion chosen. */
    public onChooseSuggestion(item: EnterData): void {
        item.func();
    }
}
