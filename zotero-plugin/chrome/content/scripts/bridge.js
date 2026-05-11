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
    this.windowState = new WeakMap();
  }

  async startup() {
    this.log(`Started ${this.version}`);
  }

  async shutdown() {
    this.removeFromAllWindows();
    this.log("Stopped");
  }

  addToAllWindows() {
    for (const win of Zotero.getMainWindows()) {
      this.addToWindow(win);
    }
  }

  removeFromAllWindows() {
    for (const win of Zotero.getMainWindows()) {
      this.removeFromWindow(win);
    }
  }

  addToWindow(win) {
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

  removeFromWindow(win) {
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
    this.windowState.delete(win);
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
    this.refreshSidebar(win).catch((error) => {
      Zotero.logError(error);
      this.setStatus(win, `Scan failed: ${error.message}`);
    });
  }

  createSidebar(win) {
    const doc = win.document;
    const sidebar = doc.createXULElement("vbox");
    sidebar.id = this.sidebarID;
    sidebar.setAttribute("orient", "vertical");
    sidebar.dataset.sourceMode = "selection";

    const headerText = this.html(doc, "div", {}, [
      this.html(doc, "h2", {}, "NotebookLM Bridge"),
      this.html(doc, "p", {}, "Export PDFs and Zotero notes into a NotebookLM-ready folder.")
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
      this.html(doc, "button", { "data-action": "choose-output" }, "Choose Output"),
      this.html(doc, "button", { "data-action": "export-package" }, "Export Package"),
      this.html(doc, "button", { "data-action": "open-notebooklm" }, "Open NotebookLM")
    ]));

    sidebar.appendChild(this.section(doc, "Status", this.html(doc, "div", {
      class: "znlm-summary",
      "data-role": "status"
    }, "Choose a Zotero source or local folder.")));

    sidebar.appendChild(this.section(doc, "Detected Sources", this.html(doc, "div", {
      class: "znlm-summary znlm-muted",
      "data-role": "summary"
    }, "No scan yet.")));

    sidebar.appendChild(this.section(doc, "Paths", [
      this.html(doc, "div", { class: "znlm-path", "data-role": "input-path" }, "Input folder: not selected"),
      this.html(doc, "div", { class: "znlm-path", "data-role": "output-path" }, "Output folder: not selected")
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
      #${this.sidebarID} .znlm-muted {
        color: #475569;
      }
      #${this.sidebarID} .znlm-path {
        margin: 4px 0;
        overflow-wrap: anywhere;
        color: #334155;
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
      await this.setSourceMode(win, target.dataset.source);
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

    if (target.dataset.action === "choose-output") {
      await this.chooseOutputFolder(win);
      return;
    }

    if (target.dataset.action === "export-package") {
      await this.exportPackage(win);
      return;
    }

    if (target.dataset.action === "open-notebooklm") {
      win.openTrustedLinkIn("https://notebooklm.google.com/", "tab");
    }
  }

  async setSourceMode(win, mode) {
    const sidebar = win.document.getElementById(this.sidebarID);
    sidebar.dataset.sourceMode = mode;

    for (const button of sidebar.querySelectorAll("[data-source]")) {
      button.classList.toggle("is-active", button.dataset.source === mode);
    }

    await this.refreshSidebar(win);
  }

  async refreshSidebar(win) {
    const sidebar = win.document.getElementById(this.sidebarID);
    if (!sidebar) {
      return;
    }

    const mode = sidebar.dataset.sourceMode || "selection";
    const report = sidebar.querySelector("[data-role='report']");
    const summary = sidebar.querySelector("[data-role='summary']");
    const status = sidebar.querySelector("[data-role='status']");
    report.textContent = "";
    this.setStatus(win, "Scanning...");

    const scan = await this.scanZoteroSource(win, mode);
    summary.textContent = `${scan.sourceCount} source item(s), ${scan.pdfCount} PDF file(s), ${scan.noteCount} note(s).`;
    if (status) {
      status.textContent = scan.sourceCount
        ? "Ready to export. Choose an output folder, then export."
        : "No exportable sources found.";
    }

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

    this.setWindowState(win, { inputFolderPath: picker.file.path });
    this.updatePathLabels(win);
    await this.setSourceMode(win, "folder");

    const sidebar = win.document.getElementById(this.sidebarID);
    const report = sidebar?.querySelector("[data-role='report']");
    if (report) {
      report.textContent = "";
      const li = win.document.createElementNS("http://www.w3.org/1999/xhtml", "li");
      li.textContent = `Local folder selected: ${picker.file.path}`;
      report.appendChild(li);
    }
  }

  async chooseOutputFolder(win) {
    const picker = Components.classes["@mozilla.org/filepicker;1"]
      .createInstance(Components.interfaces.nsIFilePicker);
    picker.init(win, "Choose an output folder for NotebookLM import", Components.interfaces.nsIFilePicker.modeGetFolder);

    const result = await new Promise((resolve) => picker.open(resolve));
    if (result !== Components.interfaces.nsIFilePicker.returnOK || !picker.file) {
      return;
    }

    this.setWindowState(win, { outputFolderPath: picker.file.path });
    this.updatePathLabels(win);
    this.setStatus(win, "Output folder selected. Ready to export.");
  }

  async scanZoteroSource(win, mode) {
    const sources = await this.collectSources(win, mode);

    const report = [];
    for (const source of sources) {
      report.push(`${source.type.toUpperCase()}: ${source.title}`);
    }

    if (!sources.length) {
      report.push(this.getEmptySourceMessage(mode));
    }

    report.push("Google sign-in is not handled inside this plugin.");

    return {
      sources,
      sourceCount: sources.length,
      pdfCount: sources.filter((source) => source.type === "pdf").length,
      noteCount: sources.filter((source) => source.type === "note").length,
      report
    };
  }

  getEmptySourceMessage(mode) {
    if (mode === "collection") {
      return "No active collection items found.";
    }
    if (mode === "folder") {
      return "No local folder selected, or no supported files found.";
    }
    return "No Zotero items selected.";
  }

  async getCollectionItems(pane) {
    const collection = pane.getSelectedCollection?.();
    if (!collection) {
      return [];
    }

    const itemIDs = await collection.getChildItems(true);
    return Zotero.Items.get(itemIDs);
  }

  async collectSources(win, mode) {
    if (mode === "folder") {
      return this.collectLocalFolderSources(win);
    }

    const pane = win.ZoteroPane || Zotero.getActiveZoteroPane?.();
    if (!pane) {
      return [];
    }
    const items = mode === "collection"
      ? await this.getCollectionItems(pane)
      : pane.getSelectedItems?.() ?? [];
    const sources = [];
    const seen = new Set();

    for (const item of items) {
      await this.collectItemSources(item, sources, seen);
    }

    return sources;
  }

  async collectItemSources(item, sources, seen) {
    if (!item) {
      return;
    }

    if (item.isNote?.()) {
      this.addNoteSource(item, sources, seen, null);
      return;
    }

    if (item.isAttachment?.()) {
      if (await this.isPdfAttachment(item)) {
        await this.addPdfAttachmentSource(item, sources, seen, null);
      }
      return;
    }

    if (!item.isRegularItem?.()) {
      return;
    }

    const parentMeta = this.getItemMetadata(item);

    for (const attachmentID of await item.getAttachments()) {
      const attachment = await Zotero.Items.getAsync(attachmentID);
      if (attachment && await this.isPdfAttachment(attachment)) {
        await this.addPdfAttachmentSource(attachment, sources, seen, parentMeta);
      }
    }

    for (const noteID of await item.getNotes()) {
      const note = await Zotero.Items.getAsync(noteID);
      if (note) {
        this.addNoteSource(note, sources, seen, parentMeta);
      }
    }
  }

  async collectLocalFolderSources(win) {
    const state = this.getWindowState(win);
    if (!state.inputFolderPath) {
      return [];
    }

    const root = Zotero.File.pathToFile(state.inputFolderPath);
    if (!root.exists() || !root.isDirectory()) {
      return [];
    }

    const files = [];
    await this.walkLocalDirectory(root, root.path, files);
    return files.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
  }

  async walkLocalDirectory(dir, rootPath, files) {
    const entries = dir.directoryEntries;
    while (entries.hasMoreElements()) {
      const entry = entries.getNext().QueryInterface(Components.interfaces.nsIFile);
      if (entry.isDirectory()) {
        await this.walkLocalDirectory(entry, rootPath, files);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = this.getExtension(entry.leafName);
      if (extension === ".pdf") {
        files.push({
          type: "pdf",
          sourceKind: "folder",
          sourcePath: entry.path,
          title: this.guessTitleFromFileName(entry.leafName),
          fileNameBase: this.guessTitleFromFileName(entry.leafName),
          relativeSourcePath: this.relativePath(rootPath, entry.path),
          metadata: {}
        });
        continue;
      }

      if (this.isNoteLikeExtension(extension)) {
        files.push({
          type: "note",
          sourceKind: "folder",
          sourcePath: entry.path,
          title: this.guessTitleFromFileName(entry.leafName),
          fileNameBase: this.guessTitleFromFileName(entry.leafName),
          relativeSourcePath: this.relativePath(rootPath, entry.path),
          metadata: {},
          outputExtension: this.getNoteOutputExtension(extension),
          transform: this.isHtmlExtension(extension) ? "html-to-text" : null
        });
      }
    }
  }

  async addPdfAttachmentSource(item, sources, seen, parentMeta) {
    const filePath = await item.getFilePathAsync?.();
    if (!filePath) {
      return;
    }

    const key = `pdf:${filePath}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    const itemTitle = item.getField?.("title") || item.key || this.guessTitleFromFileName(filePath);
    sources.push({
      type: "pdf",
      sourceKind: "zotero",
      sourcePath: filePath,
      title: parentMeta?.title || itemTitle,
      fileNameBase: parentMeta?.title || itemTitle,
      relativeSourcePath: item.key || filePath,
      zoteroKey: item.key,
      parentZoteroKey: parentMeta?.key || null,
      metadata: parentMeta || this.getItemMetadata(item)
    });
  }

  addNoteSource(item, sources, seen, parentMeta) {
    const key = `note:${item.id}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    const rawNote = item.getNote?.() || "";
    const title = this.getNoteTitle(item, rawNote, parentMeta);
    sources.push({
      type: "note",
      sourceKind: "zotero",
      noteHtml: rawNote,
      title,
      fileNameBase: title,
      relativeSourcePath: item.key || `note-${item.id}`,
      zoteroKey: item.key,
      parentZoteroKey: parentMeta?.key || null,
      metadata: parentMeta || this.getItemMetadata(item)
    });
  }

  async exportPackage(win) {
    const sidebar = win.document.getElementById(this.sidebarID);
    if (!sidebar) {
      return;
    }

    const mode = sidebar.dataset.sourceMode || "selection";
    const state = this.getWindowState(win);
    if (!state.outputFolderPath) {
      this.setStatus(win, "Choose an output folder first.");
      await this.chooseOutputFolder(win);
      if (!this.getWindowState(win).outputFolderPath) {
        return;
      }
    }

    try {
      this.setStatus(win, "Collecting sources...");
      const sources = await this.collectSources(win, mode);
      if (!sources.length) {
        this.setStatus(win, "No exportable sources found.");
        await this.refreshSidebar(win);
        return;
      }

      this.setStatus(win, "Writing NotebookLM import package...");
      const result = await this.writeImportPackage(state.outputFolderPath, sources, mode);
      this.setStatus(win, `Exported ${result.entries.length} file(s) to ${result.outputDir}`);
      this.renderExportReport(win, result);
    }
    catch (error) {
      Zotero.logError(error);
      this.setStatus(win, `Export failed: ${error.message}`);
      this.renderLines(win, [error.stack || error.message]);
    }
  }

  async writeImportPackage(outputRootPath, sources, mode) {
    const outputDir = this.makePackageDirectory(outputRootPath);
    const pdfDir = OS.Path.join(outputDir, "pdf");
    const notesDir = OS.Path.join(outputDir, "notes");
    await Zotero.File.createDirectoryIfMissingAsync(outputDir);
    await Zotero.File.createDirectoryIfMissingAsync(pdfDir);
    await Zotero.File.createDirectoryIfMissingAsync(notesDir);

    const entries = [];
    const errors = [];
    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      try {
        const entry = await this.writeSource(outputDir, pdfDir, notesDir, source, i + 1);
        entries.push(entry);
      }
      catch (error) {
        Zotero.logError(error);
        errors.push({
          source: source.title || source.sourcePath || source.zoteroKey,
          message: error.message
        });
      }
    }

    const manifest = this.makeManifest(outputDir, mode, entries, errors);
    await Zotero.File.putContentsAsync(OS.Path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await Zotero.File.putContentsAsync(OS.Path.join(outputDir, "manifest.csv"), this.toCsv(entries));
    await Zotero.File.putContentsAsync(OS.Path.join(outputDir, "README.md"), this.makeReadme(entries, errors));

    return {
      outputDir,
      entries,
      errors,
      manifest
    };
  }

  async writeSource(outputDir, pdfDir, notesDir, source, index) {
    const extension = source.type === "pdf" ? ".pdf" : source.outputExtension || ".txt";
    const fileName = this.makeNotebookLMFileName(source.fileNameBase || source.title, index, extension);
    const outputRelativePath = OS.Path.join(source.type === "pdf" ? "pdf" : "notes", fileName);

    if (source.type === "pdf") {
      await Zotero.File.copyFile(source.sourcePath, OS.Path.join(pdfDir, fileName));
    }
    else if (source.sourceKind === "folder") {
      const text = await Zotero.File.getContentsAsync(source.sourcePath);
      await Zotero.File.putContentsAsync(
        OS.Path.join(notesDir, fileName),
        source.transform === "html-to-text" ? this.htmlToText(text) : text
      );
    }
    else {
      await Zotero.File.putContentsAsync(OS.Path.join(notesDir, fileName), this.htmlToText(source.noteHtml || ""));
    }

    return {
      index,
      type: source.type,
      sourceKind: source.sourceKind,
      title: source.title,
      fileName,
      outputRelativePath,
      sourcePath: source.sourcePath || null,
      relativeSourcePath: source.relativeSourcePath || null,
      zoteroKey: source.zoteroKey || null,
      parentZoteroKey: source.parentZoteroKey || null,
      metadata: source.metadata || {}
    };
  }

  async isPdfAttachment(item) {
    const contentType = item.attachmentContentType;
    if (contentType === "application/pdf") {
      return true;
    }

    const path = await item.getFilePathAsync?.();
    return Boolean(path && path.toLowerCase().endsWith(".pdf"));
  }

  getWindowState(win) {
    if (!this.windowState.has(win)) {
      this.windowState.set(win, {});
    }
    return this.windowState.get(win);
  }

  setWindowState(win, patch) {
    const state = this.getWindowState(win);
    Object.assign(state, patch);
    this.windowState.set(win, state);
  }

  updatePathLabels(win) {
    const sidebar = win.document.getElementById(this.sidebarID);
    if (!sidebar) {
      return;
    }

    const state = this.getWindowState(win);
    const input = sidebar.querySelector("[data-role='input-path']");
    const output = sidebar.querySelector("[data-role='output-path']");
    if (input) {
      input.textContent = `Input folder: ${state.inputFolderPath || "not selected"}`;
    }
    if (output) {
      output.textContent = `Output folder: ${state.outputFolderPath || "not selected"}`;
    }
  }

  setStatus(win, message) {
    const status = win.document.getElementById(this.sidebarID)?.querySelector("[data-role='status']");
    if (status) {
      status.textContent = message;
    }
  }

  renderExportReport(win, result) {
    const lines = [
      `Output: ${result.outputDir}`,
      `PDF files: ${result.entries.filter((entry) => entry.type === "pdf").length}`,
      `Note files: ${result.entries.filter((entry) => entry.type === "note").length}`
    ];

    for (const error of result.errors) {
      lines.push(`Skipped ${error.source}: ${error.message}`);
    }

    this.renderLines(win, lines);
  }

  renderLines(win, lines) {
    const report = win.document.getElementById(this.sidebarID)?.querySelector("[data-role='report']");
    if (!report) {
      return;
    }
    report.textContent = "";
    for (const line of lines) {
      const li = win.document.createElementNS("http://www.w3.org/1999/xhtml", "li");
      li.textContent = line;
      report.appendChild(li);
    }
  }

  makePackageDirectory(outputRootPath) {
    const stamp = new Date().toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");
    return OS.Path.join(outputRootPath, `notebooklm-import-${stamp}`);
  }

  makeManifest(outputDir, mode, entries, errors) {
    return {
      generatedAt: new Date().toISOString(),
      generatedBy: `${this.id} ${this.version}`,
      sourceMode: mode,
      outputDir,
      counts: {
        pdf: entries.filter((entry) => entry.type === "pdf").length,
        note: entries.filter((entry) => entry.type === "note").length,
        skipped: errors.length
      },
      entries,
      errors
    };
  }

  toCsv(entries) {
    const rows = [
      ["index", "type", "sourceKind", "fileName", "outputRelativePath", "title", "zoteroKey", "parentZoteroKey", "sourcePath"],
      ...entries.map((entry) => [
        entry.index,
        entry.type,
        entry.sourceKind,
        entry.fileName,
        entry.outputRelativePath,
        entry.title,
        entry.zoteroKey,
        entry.parentZoteroKey,
        entry.sourcePath
      ])
    ];
    return `${rows.map((row) => row.map((cell) => this.csvCell(cell)).join(",")).join("\n")}\n`;
  }

  csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  makeReadme(entries, errors) {
    const pdfCount = entries.filter((entry) => entry.type === "pdf").length;
    const noteCount = entries.filter((entry) => entry.type === "note").length;
    return `# NotebookLM Import Package

Generated by Zotero NotebookLM Bridge.

## Contents

- PDF files: ${pdfCount}
- Note files: ${noteCount}
- Skipped files: ${errors.length}
- PDF directory: \`pdf/\`
- Notes directory: \`notes/\`
- Machine-readable manifest: \`manifest.json\`
- Spreadsheet-friendly manifest: \`manifest.csv\`

## Next step

Upload the files in \`pdf/\` and \`notes/\` to NotebookLM.
`;
  }

  getItemMetadata(item) {
    if (!item) {
      return {};
    }

    return {
      key: item.key || null,
      itemType: this.getItemTypeName(item),
      title: item.getField?.("title") || "",
      doi: item.getField?.("DOI") || "",
      url: item.getField?.("url") || "",
      date: item.getField?.("date") || "",
      publicationTitle: item.getField?.("publicationTitle") || "",
      creators: this.getCreators(item)
    };
  }

  getCreators(item) {
    try {
      return item.getCreators?.().map((creator) => ({
        firstName: creator.firstName || "",
        lastName: creator.lastName || "",
        creatorType: creator.creatorType || this.getCreatorTypeName(creator.creatorTypeID)
      })) || [];
    }
    catch (error) {
      return [];
    }
  }

  getItemTypeName(item) {
    try {
      return Zotero.ItemTypes.getName(item.itemTypeID) || null;
    }
    catch (error) {
      return item.itemType || null;
    }
  }

  getCreatorTypeName(creatorTypeID) {
    if (!creatorTypeID) {
      return "";
    }
    try {
      return Zotero.CreatorTypes.getName(creatorTypeID) || "";
    }
    catch (error) {
      return "";
    }
  }

  getNoteTitle(item, rawNote, parentMeta) {
    const title = item.getNoteTitle?.()
      || Zotero.Utilities?.Item?.noteToTitle?.(rawNote, { stopAtLineBreak: true })
      || parentMeta?.title
      || item.key
      || `Note ${item.id}`;
    return title;
  }

  makeNotebookLMFileName(title, index, extension) {
    const cleanedBase = String(title || `source-${index}`)
      .normalize("NFKD")
      .replace(/[^\w\s.-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || `source-${index}`;
    return `${String(index).padStart(4, "0")} - ${cleanedBase}${extension}`;
  }

  guessTitleFromFileName(fileName) {
    const leafName = fileName.split(/[\\/]/).pop() || fileName;
    return leafName
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  getExtension(fileName) {
    const match = fileName.toLowerCase().match(/\.[^.]+$/);
    return match ? match[0] : "";
  }

  isNoteLikeExtension(extension) {
    return [".txt", ".md", ".markdown", ".html", ".htm"].includes(extension);
  }

  isHtmlExtension(extension) {
    return [".html", ".htm"].includes(extension);
  }

  getNoteOutputExtension(extension) {
    if (this.isHtmlExtension(extension)) {
      return ".txt";
    }
    if (extension === ".markdown") {
      return ".md";
    }
    return extension || ".txt";
  }

  relativePath(rootPath, filePath) {
    if (filePath.startsWith(rootPath)) {
      return filePath.slice(rootPath.length).replace(/^[\\/]+/, "");
    }
    return filePath;
  }

  htmlToText(html) {
    return `${String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim()}\n`;
  }

  log(message) {
    Zotero.debug(`[NotebookLM Bridge] ${message}`);
  }
};
