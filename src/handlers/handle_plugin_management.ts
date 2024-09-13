import { Notice } from "obsidian";
import type AdvancedURI from "../main";

/** Plugin URIs to manage handler. */
export interface PluginUriParams {
    type: "plugin";
    /** Comma seperated list of plugin ids to enable. */
    enablePlugins?: string;
    /** Comma seperated list of plugin ids to disable. */
    disablePlugins?: string;
}

/** Handler to modify plugin states. */
export function HandlePluginManagement(parameters: PluginUriParams, pluginClass: AdvancedURI) {
    if (parameters.enablePlugins) {
        const pluginIds = parameters.enablePlugins.split(",");

        const enablePluginFunc = (pluginId: string) => {
            if (pluginClass.app.plugins.getPlugin(pluginId)) {
                pluginClass.app.plugins.enablePluginAndSave(pluginId);
                new Notice(`Enabled ${pluginId}`);
            } else if (pluginClass.app.internalPlugins.plugins[pluginId]) {
                pluginClass.app.internalPlugins.plugins[pluginId].enable(true);
                new Notice(`Enabled ${pluginId}`);
            }
        };
        for (const pluginId of pluginIds) {
            enablePluginFunc(pluginId);
        }
    }
    if (parameters.disablePlugins) {
        const pluginIds = parameters.disablePlugins.split(",");

        const disablePluginFunc = (pluginId: string) => {
            if (pluginClass.app.plugins.getPlugin(pluginId)) {
                pluginClass.app.plugins.disablePluginAndSave(pluginId);
                new Notice(`Disabled ${pluginId}`);
            } else if (pluginClass.app.internalPlugins.plugins[pluginId]) {
                pluginClass.app.internalPlugins.plugins[pluginId].disable(true);
                new Notice(`Disabled ${pluginId}`);
            }
        };
        for (const pluginId of pluginIds) {
            disablePluginFunc(pluginId);
        }
    }
}
