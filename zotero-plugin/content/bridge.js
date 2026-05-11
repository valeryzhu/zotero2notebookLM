var ZoteroNotebookLMBridgePlugin = class {
  constructor({ id, version, rootURI }) {
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.menuItemID = "zotero-notebooklm-bridge-menu-item";
    this.windowMenus = new WeakMap();
  }

  async startup() {
    this.log(`Started ${this.version}`);
  }

  async shutdown() {
    for (const win of Services.wm.getEnumerator("navigator:browser")) {
      this.onMainWindowUnload(win);
    }
    this.log("Stopped");
  }

  onMainWindowLoad(win) {
    const doc = win.document;
    const menu = doc.getElementById("menu_ToolsPopup") || doc.getElementById("zotero-tb-sync-menu");

    if (!menu || doc.getElementById(this.menuItemID)) {
      return;
    }

    const item = doc.createXULElement("menuitem");
    item.id = this.menuItemID;
    item.setAttribute("label", "Prepare NotebookLM Import...");
    item.addEventListener("command", () => this.openPrepareDialog(win));
    menu.appendChild(item);
    this.windowMenus.set(win, item);
  }

  onMainWindowUnload(win) {
    const item = this.windowMenus.get(win) || win.document?.getElementById(this.menuItemID);
    if (item) {
      item.remove();
    }
    this.windowMenus.delete(win);
  }

  async openPrepareDialog(win) {
    const message = [
      "Zotero NotebookLM Bridge skeleton is installed.",
      "",
      "Next milestone: choose a PDF folder, import files into a Zotero collection, and export a NotebookLM package.",
      "For now, run the local helper from this project directory:"
    ].join("\n");

    win.alert(message);
  }

  log(message) {
    Zotero.debug(`[NotebookLM Bridge] ${message}`);
  }
};
