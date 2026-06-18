function callDetail(call) {
  return `
    <span>Selected clip</span>
    <strong>${call.title}</strong>
    <p>${call.matchup} · ${call.date} · ${call.callType}</p>
    <small>${call.summary}</small>
  `;
}

function setSelectedCall(call, el) {
  if (!el.selectedCall) return;
  el.selectedCall.innerHTML = callDetail(call);
}

export function initVideoConstellation(el, calls) {
  if (!el.videoConstellation || !calls.length) return;

  el.videoConstellation.innerHTML = calls.map((call, index) => `
    <button
      class="call-node call-node-${index + 1}"
      data-call-id="${call.id}"
      type="button"
      aria-label="Preview ${call.title}"
    >
      <video muted loop playsinline preload="metadata">
        <source src="${call.clipSrc}" type="video/mp4">
      </video>
      <span>${call.callType}</span>
    </button>
  `).join("");

  if (el.callCount) {
    el.callCount.textContent = `${calls.length} clips staged`;
  }

  setSelectedCall(calls[0], el);

  el.videoConstellation.querySelectorAll(".call-node").forEach((node) => {
    const call = calls.find((item) => item.id === node.dataset.callId);
    const video = node.querySelector("video");

    node.addEventListener("mouseenter", () => {
      setSelectedCall(call, el);
      el.videoConstellation.dataset.active = call.id;
      video.play().catch(() => {});
    });
    
    node.addEventListener("focus", () => {
      setSelectedCall(call, el);
      el.videoConstellation.dataset.active = call.id;
      video.play().catch(() => {});
    });

    node.addEventListener("blur", () => {
      video.pause();
    });
  });
}
