import { FuzzySuggestModal } from "obsidian";
import type AdvancedURI from "../main";
import type { FileModalData } from "../types";

/** Modal to fuzzy select a file. */
export class FileModal extends FuzzySuggestModal<FileModalData> {
    plugin: AdvancedURI;
    constructor(
        plugin: AdvancedURI,
        private placeHolder: string,
        private allowNoFile: boolean = true
    ) {
        super(plugin.app);
        this.plugin = plugin;
        this.setPlaceholder(this.placeHolder);
    }

    getItems(): FileModalData[] {
        const specialItems: FileModalData[] = [];
        if (this.allowNoFile) {
            specialItems.push({
                display: "<Don't specify a file>",
                source: undefined
            });
        }
        const file = this.app.workspace.getActiveFile();
        if (file) {
            specialItems.push({ display: "<Current file>", source: file.path });
        }
        return [
            ...specialItems,
            ...this.app.vault.getFiles().map((e) => {
                return { display: e.path, source: e.path };
            })
        ];
    }

    getItemText(item: FileModalData): string {
        return item.display;
    }

    onChooseItem(_: FileModalData): void {}
}
