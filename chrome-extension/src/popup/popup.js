document.addEventListener("DOMContentLoaded", () => {
  const toggleSwitch = document.getElementById("toggle-switch");

  chrome.storage.sync.get("extensionEnabled", (data) => {
    const isEnabled = data.extensionEnabled ?? true;
    toggleSwitch.checked = isEnabled;
  });

  toggleSwitch.addEventListener("change", async () => {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ extensionEnabled: isEnabled });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_BUTTONS",
      show: isEnabled,
    });
  });
});
