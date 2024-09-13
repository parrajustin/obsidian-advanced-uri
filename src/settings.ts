import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type AdvancedURI from "./main";

export class SettingsTab extends PluginSettingTab {
    plugin: AdvancedURI;
    constructor(app: App, plugin: AdvancedURI) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: this.plugin.manifest.name });

        new Setting(containerEl).setName("Open file on write").addToggle((cb) =>
            cb.setValue(this.plugin.settings.openFileOnWrite).onChange((value) => {
                this.plugin.settings.openFileOnWrite = value;
                this.plugin.saveSettings();
            })
        );

        new Setting(containerEl)
            .setName("Open file on write in a new pane")
            .setDisabled(this.plugin.settings.openFileOnWrite)
            .addToggle((cb) =>
                cb.setValue(this.plugin.settings.openFileOnWriteInNewPane).onChange((value) => {
                    this.plugin.settings.openFileOnWriteInNewPane = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl).setName("Open daily note in a new pane").addToggle((cb) =>
            cb.setValue(this.plugin.settings.openDailyInNewPane).onChange((value) => {
                this.plugin.settings.openDailyInNewPane = value;
                this.plugin.saveSettings();
            })
        );

        new Setting(containerEl).setName("Open file without write in new pane").addToggle((cb) =>
            cb.setValue(this.plugin.settings.openFileWithoutWriteInNewPane).onChange((value) => {
                this.plugin.settings.openFileWithoutWriteInNewPane = value;
                this.plugin.saveSettings();
            })
        );

        new Setting(containerEl).setName("Use UID instead of file paths").addToggle((cb) =>
            cb.setValue(this.plugin.settings.useUID).onChange((value) => {
                this.plugin.settings.useUID = value;
                this.plugin.saveSettings();
                this.display();
            })
        );

        new Setting(containerEl).setName("Include vault name/ID parameter").addToggle((cb) =>
            cb.setValue(this.plugin.settings.includeVaultName).onChange((value) => {
                this.plugin.settings.includeVaultName = value;
                this.plugin.saveSettings();
                this.display();
            })
        );

        if (this.plugin.settings.includeVaultName) {
            new Setting(containerEl)
                .setName("Vault identifying parameter")
                .setDesc(
                    "Choose whether to use the vault Name or its internal ID as the identifying parameter."
                )
                .addDropdown((cb) =>
                    cb
                        .addOption("name", "Name")
                        .addOption("id", "ID")
                        .setValue(this.plugin.settings.vaultParam)
                        .onChange((value: "id" | "name") => {
                            this.plugin.settings.vaultParam = value;
                            this.plugin.saveSettings();
                        })
                );
        }

        if (this.plugin.settings.useUID) {
            new Setting(containerEl)
                .setName("Add filepath parameter")
                .setDesc(
                    "When using UID instead of file paths, you can still add the filepath parameter to know what this URI is about. It's NOT actually used."
                )
                .addToggle((cb) =>
                    cb.setValue(this.plugin.settings.addFilepathWhenUsingUID).onChange((value) => {
                        this.plugin.settings.addFilepathWhenUsingUID = value;
                        this.plugin.saveSettings();
                    })
                );
        }
        new Setting(containerEl).setName("UID field in frontmatter").addText((cb) =>
            cb.setValue(this.plugin.settings.idField).onChange((value) => {
                this.plugin.settings.idField = value;
                this.plugin.saveSettings();
            })
        );

        new Setting(containerEl)
            .setName("Allow executing arbitrary code via eval")
            .setDesc(
                "⚠️ This can be dangerous as it allows executing arbitrary code. Only enable this if you trust the source of the URIs you are using and know what you are doing. ⚠️"
            )
            .addToggle((cb) =>
                cb.setValue(this.plugin.settings.allowEval).onChange((value) => {
                    this.plugin.settings.allowEval = value;
                    this.plugin.saveSettings();
                })
            );

        const setOfForeignTypes = new Set<string>();
        for (const handler of this.plugin.registeredHandlers) {
            setOfForeignTypes.add(handler.data.type);

            new Setting(containerEl)
                .setName(`Allow "registered" foreign handler "${handler.data.type}".`)
                .setDesc(handler.data.desc)
                .addToggle((cb) =>
                    cb
                        .setValue(
                            this.plugin.settings.enabledForeignTypes.includes(handler.data.type)
                        )
                        .onChange((value) => {
                            if (value) {
                                this.plugin.settings.enabledForeignTypes.push(handler.data.type);
                            } else {
                                this.plugin.settings.enabledForeignTypes =
                                    this.plugin.settings.enabledForeignTypes.filter(
                                        (f) => f !== handler.data.type
                                    );
                            }
                            this.plugin.saveSettings();
                        })
                );
        }

        for (const type of this.plugin.settings.enabledForeignTypes) {
            if (setOfForeignTypes.has(type)) {
                continue;
            }
            setOfForeignTypes.add(type);

            new Setting(containerEl)
                .setName(`Allow "unregistered" foreign handler "${type}".`)
                .setDesc("waiting to be registered.")
                .addToggle((cb) =>
                    cb.setValue(true).onChange((value) => {
                        if (value) {
                            this.plugin.settings.enabledForeignTypes.push(type);
                        } else {
                            this.plugin.settings.enabledForeignTypes =
                                this.plugin.settings.enabledForeignTypes.filter((f) => f !== type);
                        }
                        this.plugin.saveSettings();
                    })
                );
        }
    }
}
