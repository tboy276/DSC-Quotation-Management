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
    const originalType = input.type;

    // Luôn toggle sang "text" để đọc vị trí con trỏ chính xác —
    // KHÔNG dựa vào try/catch vì input[type=number] có thể trả về null
    // thay vì throw exception, tuỳ trình duyệt/phiên bản.
    input.type = "text";
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.type = originalType;

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

      const newCursorPos = start + text.length;
      input.type = "text";
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.type = originalType;
    }
  };

  document.addEventListener("beforeinput", handleBeforeInput as EventListener, { capture: true });
  document.addEventListener("paste", handlePaste as EventListener, { capture: true });

  return () => {
    document.removeEventListener("beforeinput", handleBeforeInput as EventListener, { capture: true });
    document.removeEventListener("paste", handlePaste as EventListener, { capture: true });
  };
}
