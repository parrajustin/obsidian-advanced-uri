import { SuggestModal } from "obsidian";
import type AdvancedURI from "../main";
import type { SearchModalData } from "../types";

export class ReplaceModal extends SuggestModal<string> {
    plugin: AdvancedURI;
    emptyText = "Empty text (replace with nothing)";
    constructor(
        plugin: AdvancedURI,
        private _search: SearchModalData,
        private _filepath: string
    ) {
        super(plugin.app);
        this.plugin = plugin;
        this.setPlaceholder("Replacement text");
    }

    public getSuggestions(query: string): string[] {
        if (query === "") {
            query = this.emptyText;
        }
        return [query];
    }

    public renderSuggestion(value: string, el: HTMLElement): void {
        el.innerText = value;
    }

    public async onChooseSuggestion(item: string, _: MouseEvent | KeyboardEvent): Promise<void> {
        if (this._search.isRegEx) {
            await this.plugin.tools.copyURI({
                filepath: this._filepath,
                searchregex: this._search.source,
                replace: item == this.emptyText ? "" : item,
                uid: ""
            });
        }
        await this.plugin.tools.copyURI({
            filepath: this._filepath,
            search: this._search.source,
            replace: item == this.emptyText ? "" : item,
            uid: ""
        });
    }
}
