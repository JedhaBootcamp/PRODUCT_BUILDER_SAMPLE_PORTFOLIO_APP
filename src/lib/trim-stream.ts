import "server-only";
import type { StreamTextTransform, ToolSet } from "ai";

// Safety net for the "2-3 sentences" rule. Small models sometimes append a
// separator ("---") or a list of every project after their answer, which
// duplicates the cards. This filter sits on the stream and drops everything
// from the first blank line, separator, heading or list item onwards.
const CUT = /\n\s*(?:\n|-{3,}|#|[-*•]\s|\d+\.\s)/;

export function trimAfterAnswer<TOOLS extends ToolSet>(): StreamTextTransform<TOOLS> {
  return () => {
    let full = ""; // text received so far in the current text block
    let sent = 0; // how many characters of `full` were already sent
    let cut = false;

    return new TransformStream({
      transform(part, controller) {
        if (part.type === "text-start") {
          full = "";
          sent = 0;
          cut = false;
        }
        if (part.type === "text-delta") {
          if (cut) return; // drop the rest of this block
          full += part.text;
          const match = CUT.exec(full);
          // Hold back what follows the last newline: the next chunk may turn
          // it into a separator ("\n" + "---").
          const safeEnd = match ? match.index : full.lastIndexOf("\n") === -1 ? full.length : full.lastIndexOf("\n");
          if (match) cut = true;
          if (safeEnd > sent) {
            controller.enqueue({ ...part, text: full.slice(sent, safeEnd) });
            sent = safeEnd;
          }
          return;
        }
        if (part.type === "text-end" && !cut && sent < full.length) {
          // Block finished normally: release what we were holding back.
          controller.enqueue({ type: "text-delta", id: part.id, text: full.slice(sent) });
          sent = full.length;
        }
        controller.enqueue(part);
      },
    });
  };
}
