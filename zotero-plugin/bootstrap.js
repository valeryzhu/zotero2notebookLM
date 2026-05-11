var ZoteroNotebookLMBridge;

function install() {}

async function startup({ id, version, rootURI }) {
  Services.scriptloader.loadSubScript(`${rootURI}chrome/content/scripts/bridge.js`);
  ZoteroNotebookLMBridge = new ZoteroNotebookLMBridgePlugin({ id, version, rootURI });
  await ZoteroNotebookLMBridge.startup();
  ZoteroNotebookLMBridge.addToAllWindows();
}

function onMainWindowLoad({ window }) {
  ZoteroNotebookLMBridge?.addToWindow(window);
}

function onMainWindowUnload({ window }) {
  ZoteroNotebookLMBridge?.removeFromWindow(window);
}

async function shutdown() {
  await ZoteroNotebookLMBridge?.shutdown();
  ZoteroNotebookLMBridge = null;
}

function uninstall() {}
