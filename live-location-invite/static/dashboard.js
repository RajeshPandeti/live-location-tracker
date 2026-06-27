let pollId = null;
let mapFrame = null;

function setStatus(message, tone = "") {
  const statusEl = document.querySelector("#status");
  if (!statusEl) {
    return;
  }
  statusEl.innerHTML = message;
  statusEl.className = `status ${tone}`.trim();
}

function updateMap(lat, lng) {
  if (!mapFrame) {
    return;
  }

  const zoom = 19;
  const src = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  mapFrame.src = src;
}

async function loadLocation() {
  const searchInput = document.querySelector("#searchPhone");
  if (!searchInput) {
    setStatus("Search input not available.", "bad");
    return;
  }

  const phone = encodeURIComponent(searchInput.value.trim());

  if (!phone) {
    setStatus("Enter a phone number to track.", "bad");
    return;
  }

  const response = await fetch(`/api/location/${phone}`);
  const data = await response.json();

  if (!response.ok) {
    setStatus(data.error || "No shared location found.", "bad");
    return;
  }

  const roundedLat = data.latitude.toFixed(6);
  const roundedLng = data.longitude.toFixed(6);
  updateMap(roundedLat, roundedLng);

  const updated = new Date(data.updatedAt).toLocaleTimeString();
  const accuracy = data.accuracy ? ` Accuracy: ${Math.round(data.accuracy)} meters.` : "";
  setStatus(`Exact location: ${roundedLat}, ${roundedLng}. Updated at ${updated}.${accuracy}`, "good");
}

window.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector("#searchPhone");
  const trackBtn = document.querySelector("#trackBtn");
  const inviteBtn = document.querySelector("#inviteBtn");
  const mapFrameElement = document.querySelector("#mapFrame");

  if (!searchInput || !trackBtn || !inviteBtn || !mapFrameElement) {
    setStatus("Dashboard page components failed to load.", "bad");
    return;
  }

  mapFrame = mapFrameElement;

  trackBtn.addEventListener("click", () => {
    window.clearInterval(pollId);
    loadLocation();
    pollId = window.setInterval(loadLocation, 5000);
  });

  inviteBtn.addEventListener("click", async () => {
    const phone = searchInput.value.trim();

    if (phone.length < 7) {
      setStatus("Enter the phone number first, then create an invite.", "bad");
      return;
    }

    const shareUrl = `${window.location.origin}/share?phone=${encodeURIComponent(phone)}`;
    const message = `Please open this link only if you agree to share this phone's live GPS location: ${shareUrl}`;
    const smsUrl = `sms:${encodeURIComponent(phone)}?&body=${encodeURIComponent(message)}`;

    try {
      await navigator.clipboard.writeText(message);
      setStatus(`Invite copied. Send it by SMS or WhatsApp. <a href="${smsUrl}">Open SMS</a>`, "good");
    } catch {
      setStatus(`Send this consent invite: <a href="${shareUrl}">${shareUrl}</a>`, "good");
    }
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      trackBtn.click();
    }
  });
});
