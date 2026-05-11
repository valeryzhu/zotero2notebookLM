var ZoteroNotebookLMBridgePlugin = class {
  constructor({ id, version, rootURI }) {
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.menuItemID = "zotero-notebooklm-bridge-menu-item";
    this.sidebarID = "zotero-notebooklm-bridge-sidebar";
    this.styleID = "zotero-notebooklm-bridge-style";
    this.windowMenus = new WeakMap();
    this.windowSidebars = new WeakMap();
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

    this.injectStyles(doc);

    if (menu && !doc.getElementById(this.menuItemID)) {
      const item = doc.createXULElement("menuitem");
      item.id = this.menuItemID;
      item.setAttribute("label", "NotebookLM Bridge");
      item.addEventListener("command", () => this.toggleSidebar(win));
      menu.appendChild(item);
      this.windowMenus.set(win, item);
    }
  }

  onMainWindowUnload(win) {
    const item = this.windowMenus.get(win) || win.document?.getElementById(this.menuItemID);
    if (item) {
      item.remove();
    }

    const sidebar = this.windowSidebars.get(win) || win.document?.getElementById(this.sidebarID);
    if (sidebar) {
      sidebar.remove();
    }

    const style = win.document?.getElementById(this.styleID);
    if (style) {
      style.remove();
    }

    this.windowMenus.delete(win);
    this.windowSidebars.delete(win);
  }

  toggleSidebar(win) {
    const existing = win.document.getElementById(this.sidebarID);
    if (existing) {
      existing.hidden = !existing.hidden;
      return;
    }

    const sidebar = this.createSidebar(win);
    win.document.documentElement.appendChild(sidebar);
    this.windowSidebars.set(win, sidebar);
    this.refreshSidebar(win);
  }

  createSidebar(win) {
    const doc = win.document;
    const sidebar = doc.createXULElement("vbox");
    sidebar.id = this.sidebarID;
    sidebar.setAttribute("orient", "vertical");

    const headerText = this.html(doc, "div", {}, [
      this.html(doc, "h2", {}, "NotebookLM Bridge"),
      this.html(doc, "p", {}, "Prepare PDFs and notes without storing Google credentials.")
    ]);
    const closeButton = this.html(doc, "button", {
      class: "znlm-icon-button",
      "data-action": "close",
      title: "Close"
    }, "x");
    sidebar.appendChild(this.html(doc, "div", { class: "znlm-header" }, [headerText, closeButton]));

    const sourceButtons = this.html(doc, "div", { class: "znlm-segmented" }, [
      this.html(doc, "button", { class: "is-active", "data-source": "selection" }, "Selection"),
      this.html(doc, "button", { "data-source": "collection" }, "Collection"),
      this.html(doc, "button", { "data-source": "folder" }, "Folder")
    ]);
    sidebar.appendChild(this.section(doc, "Source", sourceButtons));

    sidebar.appendChild(this.html(doc, "div", { class: "znlm-section znlm-actions" }, [
      this.html(doc, "button", { "data-action": "scan" }, "Scan Zotero Source"),
      this.html(doc, "button", { "data-action": "choose-folder" }, "Choose Local Folder"),
      this.html(doc, "button", { "data-action": "open-notebooklm" }, "Open NotebookLM")
    ]));

    sidebar.appendChild(this.section(doc, "Detected Sources", this.html(doc, "div", {
      class: "znlm-summary",
      "data-role": "summary"
    }, "No scan yet.")));

    sidebar.appendChild(this.section(doc, "Next Step", [
      this.html(doc, "p", { class: "znlm-copy" }, "Use the local helper to create the import package, then upload the generated PDFs and notes to NotebookLM. Google sign-in stays in the browser."),
      this.html(doc, "pre", { "data-role": "command" }, "node .\\helper\\src\\cli.js prepare --input <folder> --output .\\outputs\\notebooklm-import")
    ]));

    sidebar.appendChild(this.section(doc, "Report", this.html(doc, "ul", {
      class: "znlm-list",
      "data-role": "report"
    })));

    sidebar.addEventListener("click", (event) => this.handleSidebarClick(win, event));
    return sidebar;
  }

  section(doc, label, content) {
    const section = this.html(doc, "div", { class: "znlm-section" }, [
      this.html(doc, "label", { class: "znlm-label" }, label)
    ]);
    const contentItems = Array.isArray(content) ? content : [content];
    for (const item of contentItems) {
      section.appendChild(item);
    }
    return section;
  }

  html(doc, tag, attrs = {}, content = null) {
    const element = doc.createElementNS("http://www.w3.org/1999/xhtml", tag);

    for (const [name, value] of Object.entries(attrs)) {
      element.setAttribute(name, value);
    }

    if (Array.isArray(content)) {
      for (const child of content) {
        element.appendChild(child);
      }
    }
    else if (content !== null) {
      element.textContent = content;
    }

    return element;
  }

  injectStyles(doc) {
    if (doc.getElementById(this.styleID)) {
      return;
    }

    const style = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
    style.id = this.styleID;
    style.textContent = `
      #${this.sidebarID} {
        position: fixed;
        top: 72px;
        right: 16px;
        z-index: 99999;
        width: min(380px, calc(100vw - 32px));
        max-height: calc(100vh - 96px);
        overflow: auto;
        padding: 16px;
        border: 1px solid #c9d2dc;
        background: #f8fafc;
        color: #15202b;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
        font: menu;
      }
      #${this.sidebarID}[hidden] {
        display: none;
      }
      #${this.sidebarID} .znlm-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      #${this.sidebarID} h2 {
        margin: 0 0 4px;
        font-size: 16px;
        line-height: 1.3;
      }
      #${this.sidebarID} p {
        margin: 0;
        line-height: 1.45;
      }
      #${this.sidebarID} .znlm-section {
        padding: 12px 0;
        border-top: 1px solid #dbe3ea;
      }
      #${this.sidebarID} .znlm-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
      }
      #${this.sidebarID} .znlm-segmented,
      #${this.sidebarID} .znlm-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      #${this.sidebarID} button {
        border: 1px solid #aab7c4;
        background: #ffffff;
        color: #15202b;
        padding: 6px 10px;
        cursor: pointer;
      }
      #${this.sidebarID} button:hover {
        background: #eef4f8;
      }
      #${this.sidebarID} button.is-active {
        border-color: #2563eb;
        background: #dbeafe;
      }
      #${this.sidebarID} .znlm-icon-button {
        min-width: 28px;
        padding: 4px 8px;
      }
      #${this.sidebarID} .znlm-summary {
        padding: 10px;
        background: #ffffff;
        border: 1px solid #dbe3ea;
      }
      #${this.sidebarID} pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        margin: 8px 0 0;
        padding: 10px;
        background: #0f172a;
        color: #e2e8f0;
      }
      #${this.sidebarID} .znlm-list {
        margin: 0;
        padding-left: 18px;
      }
      #${this.sidebarID} .znlm-list li {
        margin: 4px 0;
      }
    `;

    doc.documentElement.appendChild(style);
  }

  async handleSidebarClick(win, event) {
    const target = event.target;

    if (!target?.dataset) {
      return;
    }

    if (target.dataset.source) {
      this.setSourceMode(win, target.dataset.source);
      return;
    }

    if (target.dataset.action === "close") {
      win.document.getElementById(this.sidebarID)?.remove();
      this.windowSidebars.delete(win);
      return;
    }

    if (target.dataset.action === "scan") {
      await this.refreshSidebar(win);
      return;
    }

    if (target.dataset.action === "choose-folder") {
      await this.chooseFolder(win);
      return;
    }

    if (target.dataset.action === "open-notebooklm") {
      win.openTrustedLinkIn("https://notebooklm.google.com/", "tab");
    }
  }

  setSourceMode(win, mode) {
    const sidebar = win.document.getElementById(this.sidebarID);
    sidebar.dataset.sourceMode = mode;

    for (const button of sidebar.querySelectorAll("[data-source]")) {
      button.classList.toggle("is-active", button.dataset.source === mode);
    }

    this.refreshSidebar(win);
  }

  async refreshSidebar(win) {
    const sidebar = win.document.getElementById(this.sidebarID);
    if (!sidebar) {
      return;
    }

    const mode = sidebar.dataset.sourceMode || "selection";
    const report = sidebar.querySelector("[data-role='report']");
    const summary = sidebar.querySelector("[data-role='summary']");
    report.textContent = "";

    const scan = await this.scanZoteroSource(win, mode);
    summary.textContent = `${scan.items.length} item(s), ${scan.pdfCount} PDF attachment(s), ${scan.noteCount} note(s).`;

    for (const line of scan.report) {
      const li = win.document.createElementNS("http://www.w3.org/1999/xhtml", "li");
      li.textContent = line;
      report.appendChild(li);
    }
  }

  async chooseFolder(win) {
    const picker = Components.classes["@mozilla.org/filepicker;1"]
      .createInstance(Components.interfaces.nsIFilePicker);
    picker.init(win, "Choose a folder for NotebookLM import", Components.interfaces.nsIFilePicker.modeGetFolder);

    const result = await new Promise((resolve) => picker.open(resolve));
    if (result !== Components.interfaces.nsIFilePicker.returnOK || !picker.file) {
      return;
    }

    const sidebar = win.document.getElementById(this.sidebarID);
    const command = sidebar?.querySelector("[data-role='command']");
    if (command) {
      command.textContent = `node .\\helper\\src\\cli.js prepare --input "${picker.file.path}" --output .\\outputs\\notebooklm-import`;
    }

    const report = sidebar?.querySelector("[data-role='report']");
    if (report) {
      report.textContent = "";
      const li = win.document.createElementNS("http://www.w3.org/1999/xhtml", "li");
      li.textContent = `Local folder selected: ${picker.file.path}`;
      report.appendChild(li);
    }
  }

  async scanZoteroSource(win, mode) {
    const pane = win.ZoteroPane || Zotero.getActiveZoteroPane();
    const items = mode === "collection"
      ? await this.getCollectionItems(pane)
      : pane.getSelectedItems?.() ?? [];

    const report = [];
    let pdfCount = 0;
    let noteCount = 0;

    for (const item of items) {
      const itemLabel = item.getField?.("title") || item.key || `Item ${item.id}`;

      if (item.isNote?.()) {
        noteCount += 1;
        report.push(`Note: ${itemLabel}`);
        continue;
      }

      if (item.isAttachment?.()) {
        if (await this.isPdfAttachment(item)) {
          pdfCount += 1;
          report.push(`PDF: ${itemLabel}`);
        }
        continue;
      }

      if (item.isRegularItem?.()) {
        const attachments = await item.getAttachments();
        const notes = await item.getNotes();
        let itemPdfCount = 0;

        for (const attachmentID of attachments) {
          const attachment = await Zotero.Items.getAsync(attachmentID);
          if (attachment && await this.isPdfAttachment(attachment)) {
            pdfCount += 1;
            itemPdfCount += 1;
          }
        }

        noteCount += notes.length;
        report.push(`${itemLabel}: ${itemPdfCount} PDF, ${notes.length} note(s)`);
      }
    }

    if (!items.length) {
      report.push(mode === "collection" ? "No active collection items found." : "No Zotero items selected.");
    }

    report.push("Google sign-in is not handled inside this plugin; use the browser login state for NotebookLM.");

    return {
      items,
      pdfCount,
      noteCount,
      report
    };
  }

  async getCollectionItems(pane) {
    const collection = pane.getSelectedCollection?.();
    if (!collection) {
      return [];
    }

    const itemIDs = await collection.getChildItems(true);
    return Zotero.Items.get(itemIDs);
  }

  async isPdfAttachment(item) {
    const contentType = item.attachmentContentType;
    if (contentType === "application/pdf") {
      return true;
    }

    const path = await item.getFilePathAsync?.();
    return Boolean(path && path.toLowerCase().endsWith(".pdf"));
  }

  log(message) {
    Zotero.debug(`[NotebookLM Bridge] ${message}`);
  }
};
