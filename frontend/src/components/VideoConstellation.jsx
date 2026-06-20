import { useEffect, useRef, useState } from "react";
import { controversialCalls } from "../data/controversialCalls.js";

export default function VideoConstellation() {
  const [selectedCall, setSelectedCall] = useState(controversialCalls[0]);
  const [activeCallId, setActiveCallId] = useState("");
  const videoRefs = useRef(new Map());

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      playMuted(video);
    });
  }, []);

  function playMuted(video) {
    video.muted = true;
    video.play().catch(() => {});
  }

  function activateCall(call) {
    setSelectedCall(call);
    setActiveCallId(call.id);
    videoRefs.current.forEach((video, id) => {
      if (id !== call.id) {
        playMuted(video);
        return;
      }

      video.muted = false;
      video.play().catch(() => {
        // Hover is not always considered an audio gesture, especially in Safari.
        // Preserve the visual preview when the browser blocks unmuted playback.
        playMuted(video);
      });
    });
  }

  function deactivateCall() {
    setActiveCallId("");
    videoRefs.current.forEach((video) => {
      playMuted(video);
    });
  }

  return (
    <div className="call-lab glass-panel" aria-label="Controversial call video collection">
      <div className="call-lab-header">
        <div>
          <span>Video evidence board</span>
          <strong>Hover a call</strong>
        </div>
        <small>{controversialCalls.length} clips staged</small>
      </div>
      <div className="video-constellation" aria-label="Interactive controversial call video constellation">
        {controversialCalls.map((call, index) => (
          <button
            className={`call-node call-node-${index + 1}${activeCallId === call.id ? " active" : ""}`}
            key={call.id}
            type="button"
            onMouseEnter={() => activateCall(call)}
            onMouseLeave={deactivateCall}
            onFocus={() => activateCall(call)}
            onBlur={deactivateCall}
            aria-label={`Preview ${call.title}`}
          >
            <video
              ref={(node) => {
                if (node) videoRefs.current.set(call.id, node);
                else videoRefs.current.delete(call.id);
              }}
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
            >
              <source src={call.clipSrc} type="video/mp4" />
            </video>
            <span>{call.callType}</span>
          </button>
        ))}
      </div>
      <article className="selected-call liquid-card" aria-live="polite">
        <span>Selected clip</span>
        <strong>{selectedCall.title}</strong>
        <p>{selectedCall.matchup} · {selectedCall.date} · {selectedCall.callType}</p>
        <small>{selectedCall.summary}</small>
      </article>
    </div>
  );
}
