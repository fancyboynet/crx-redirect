document.querySelector('#btnOpt').addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
        // New way to open options pages, if supported (Chrome 42+).
        chrome.runtime.openOptionsPage();
    } else {
        // Reasonable fallback.
        window.open(chrome.runtime.getURL('options.html'));
    }
}, false);
document.querySelector('#btnIssue').addEventListener('click', function() {
    chrome.tabs.create({url: "https://github.com/fancyboynet/crx-redirect/issues"});
}, false);