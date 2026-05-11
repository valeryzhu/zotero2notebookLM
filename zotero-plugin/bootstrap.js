var ZoteroNotebookLMBridge;
var ZoteroNotebookLMBridgeChromeHandle;

function install() {}

async function startup({ id, version, resourceURI, rootURI }) {
  if (!rootURI) {
    rootURI = resourceURI.spec;
  }

  const aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  const manifestURI = Services.io.newURI(rootURI + "manifest.json");
  ZoteroNotebookLMBridgeChromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "zotero2notebooklm", rootURI + "chrome/content/"],
  ]);

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
  if (ZoteroNotebookLMBridgeChromeHandle) {
    ZoteroNotebookLMBridgeChromeHandle.destruct();
    ZoteroNotebookLMBridgeChromeHandle = null;
  }
}

function uninstall() {}
