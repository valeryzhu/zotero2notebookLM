var ZoteroNotebookLMBridge;

function install() {}

async function startup({ id, version, rootURI }) {
  Services.scriptloader.loadSubScript(`${rootURI}content/bridge.js`);
  ZoteroNotebookLMBridge = new ZoteroNotebookLMBridgePlugin({ id, version, rootURI });
  await ZoteroNotebookLMBridge.startup();
}

function onMainWindowLoad({ window }) {
  ZoteroNotebookLMBridge?.onMainWindowLoad(window);
}

function onMainWindowUnload({ window }) {
  ZoteroNotebookLMBridge?.onMainWindowUnload(window);
}

async function shutdown() {
  await ZoteroNotebookLMBridge?.shutdown();
  ZoteroNotebookLMBridge = null;
}

function uninstall() {}
