// Record yourself and compare with the model. The recording stays in this tab's memory: it is never uploaded or saved.
type Deps = { playUrl: (url: string, btn: HTMLElement | null) => Promise<boolean>; srcFor: (el: HTMLElement) => string | null; stop: () => void };

const MAX_MS = 30000;
let toggle: () => void = () => {};
export const toggleRecording = () => toggle();

export function initRecorder({ playUrl, srcFor, stop }: Deps) {
  const root = document.querySelector<HTMLElement>("[data-recorder]");
  if (!root) return;
  const btn = root.querySelector<HTMLButtonElement>("[data-rec-toggle]")!;
  const label = btn.querySelector<HTMLElement>(".label")!;
  const status = root.querySelector<HTMLElement>(".rec-status")!;
  const result = root.querySelector<HTMLElement>(".rec-result")!;
  const select = root.querySelector<HTMLSelectElement>("[data-rec-target]")!;
  const mine = root.querySelector<HTMLButtonElement>("[data-rec-mine]")!;
  const model = root.querySelector<HTMLButtonElement>("[data-rec-model]")!;
  const compare = root.querySelector<HTMLButtonElement>("[data-rec-compare]")!;

  const say = (msg: string, error = false) => { status.textContent = msg; status.classList.toggle("error", error); };
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    btn.disabled = true;
    say("This browser cannot record audio. You can still listen and repeat out loud.");
    return;
  }

  let rec: MediaRecorder | null = null;
  let pending = false; // waiting for microphone permission: a second press must not start a second recorder
  let url: string | null = null;
  let timer = 0;
  let started = 0;
  let tick = 0;
  const modelUrl = () => srcFor(select.selectedOptions[0]);

  const setRecording = (on: boolean) => {
    btn.classList.toggle("is-recording", on);
    btn.setAttribute("aria-pressed", String(on));
    label.textContent = on ? "Stop recording" : url ? "Record again" : "Record yourself";
    select.disabled = on;
  };

  async function start() {
    if (pending || rec) return;
    pending = true;
    btn.disabled = true;
    stop();
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) {
      pending = false;
      btn.disabled = false;
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      say(denied ? "The microphone is blocked. Allow it for this site in your browser's address bar, then try again." : "No microphone was found. Connect one and try again.", true);
      return;
    }
    pending = false;
    btn.disabled = false;
    const chunks: Blob[] = [];
    try { rec = new MediaRecorder(stream); }
    catch { stream.getTracks().forEach((t) => t.stop()); say("This browser could not start recording. Try another browser.", true); return; }
    const r = rec; // this session's recorder; the timers below must never stop a later one
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearTimeout(timer); clearInterval(tick);
      if (url) URL.revokeObjectURL(url);
      url = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: r.mimeType || "audio/webm" })) : null;
      rec = null;
      setRecording(false);
      result.hidden = !url;
      say(url ? "Done. Listen to yourself, or play the model first and then you." : "Nothing was recorded. Try again.", !url);
      if (url) compare.focus();
    };
    r.start();
    started = Date.now();
    setRecording(true);
    say("Recording… say it now. Press again to stop (it stops by itself after 30 seconds).");
    tick = window.setInterval(() => say(`Recording… ${Math.round((Date.now() - started) / 1000)} s. Press again to stop.`), 1000);
    timer = window.setTimeout(() => { if (r.state === "recording") r.stop(); }, MAX_MS);
  }

  toggle = () => { if (rec) rec.stop(); else if (!pending && !btn.disabled) start(); };
  btn.addEventListener("click", toggle);
  select.addEventListener("change", () => { if (url) say("The target changed. Record again to compare with this part."); });
  mine.addEventListener("click", () => { if (url) playUrl(url, mine); });
  model.addEventListener("click", () => { const m = modelUrl(); if (m) playUrl(m, model); });
  compare.addEventListener("click", async () => {
    const m = modelUrl();
    if (!m || !url) return;
    if (!(await playUrl(m, compare))) return; // stopped part-way: do not go on to the recording
    await new Promise((r) => setTimeout(r, 350));
    if (url) await playUrl(url, compare);
  });
}
