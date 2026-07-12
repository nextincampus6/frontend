export const openPdfViewerPortal = (
  newTab: Window | null,
  objectUrl: string,
  filename: string,
  candidateName?: string
) => {
  if (!newTab) {
    window.open(objectUrl, '_blank');
    return;
  }

  const cleanName = filename ? filename.replace(/^[0-9]+-/, '') : 'Resume.pdf';
  const subtitle = candidateName ? `Verified Resume • ${candidateName}` : 'Verified Candidate Resume';

  const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cleanName} — NextInCampus Document Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #09090b;
      color: #f4f4f5;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .top-bar {
      height: 64px;
      background: rgba(18, 18, 22, 0.94);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      color: #c084fc;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #a855f7;
      box-shadow: 0 0 8px #a855f7;
    }
    .file-info {
      display: flex;
      flex-direction: column;
    }
    .file-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }
    .file-subtitle {
      font-size: 11px;
      color: #a1a1aa;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #d4d4d8;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
    .btn-primary {
      background: #9333ea;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
    }
    .btn-primary:hover {
      background: #a855f7;
    }
    .viewer-container {
      flex: 1;
      width: 100%;
      height: calc(100vh - 64px);
      background: #18181b;
      position: relative;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  </style>
</head>
<body>
  <header class="top-bar">
    <div class="brand">
      <div class="brand-badge">
        <span class="dot"></span>
        <span>NextInCampus Portal</span>
      </div>
      <div class="file-info">
        <span class="file-title">${cleanName}</span>
        <span class="file-subtitle">${subtitle}</span>
      </div>
    </div>
    <div class="actions">
      <a href="${objectUrl}" target="_blank" class="btn btn-secondary" title="Open PDF in default browser tab">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        Open Raw PDF
      </a>
      <a href="${objectUrl}" download="${cleanName}" class="btn btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download PDF
      </a>
    </div>
  </header>
  <main class="viewer-container">
    <iframe src="${objectUrl}#toolbar=1&navpanes=1&statusbar=1&view=FitH" title="Resume Document Viewer"></iframe>
  </main>
</body>
</html>`;

  newTab.document.open();
  newTab.document.write(viewerHtml);
  newTab.document.close();
  newTab.document.title = `${cleanName} — NextInCampus Document Portal`;
};
