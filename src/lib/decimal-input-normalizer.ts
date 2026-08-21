export function initDecimalInputNormalizer() {
  const handleBeforeInput = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    if (!target || typeof target.matches !== "function" || !target.matches("input[type='number']")) return;

    if (e.data === ",") {
      e.preventDefault();
      insertTextAtCursor(target, ".");
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const target = e.target as HTMLInputElement;
    if (!target || typeof target.matches !== "function" || !target.matches("input[type='number']")) return;

    const pastedData = e.clipboardData?.getData("text");
    if (pastedData && pastedData.includes(",")) {
      e.preventDefault();
      const normalizedData = pastedData.replace(/,/g, ".");
      insertTextAtCursor(target, normalizedData);
    }
  };

  const insertTextAtCursor = (input: HTMLInputElement, text: string) => {
    let start = 0;
    let end = 0;
    
    try {
      start = input.selectionStart || 0;
      end = input.selectionEnd || 0;
    } catch (err) {
      const originalType = input.type;
      input.type = "text";
      start = input.selectionStart || 0;
      end = input.selectionEnd || 0;
      input.type = originalType;
    }

    const currentValue = input.value;
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, newValue);
      const event = new Event("input", { bubbles: true });
      input.dispatchEvent(event);
      
      try {
        input.setSelectionRange(start + text.length, start + text.length);
      } catch (err) {
        const originalType = input.type;
        input.type = "text";
        input.setSelectionRange(start + text.length, start + text.length);
        input.type = originalType;
      }
    }
  };

  document.addEventListener("beforeinput", handleBeforeInput as EventListener, { capture: true });
  document.addEventListener("paste", handlePaste as EventListener, { capture: true });

  return () => {
    document.removeEventListener("beforeinput", handleBeforeInput as EventListener, { capture: true });
    document.removeEventListener("paste", handlePaste as EventListener, { capture: true });
  };
}
