chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "export") {
    const { text, filename } = message;
    const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
    chrome.downloads.download(
      {
        url: dataUrl,
        filename,
        saveAs: true,
      },
      () => {
        sendResponse({ ok: chrome.runtime.lastError ? false : true });
      }
    );
    return true; // 非同期 sendResponse のため
  }
});
