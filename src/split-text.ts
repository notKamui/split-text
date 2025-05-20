interface SplitResult {
  chars: HTMLSpanElement[];
  words: HTMLSpanElement[];
  lines: HTMLSpanElement[];
}

type ElementOrSelector = string | Element | Element[] | NodeListOf<Element>;

function createSpan(type: "char" | "word" | "line") {
  const span = document.createElement("span");
  span.style.display = "inline-block";
  span.className = `split-${type}`;
  span.setAttribute("aria-hidden", "true");
  return span;
}

function getLineGroups(element: Element): Node[][] {
  const lineGroups = [] as Node[][];
  let currentGroup = [] as Node[];
  let lastTop = null as number | null;
  for (const node of element.childNodes) {
    if (!(node instanceof HTMLSpanElement)) {
      currentGroup.push(node);
      continue;
    }

    const top = node.offsetTop;
    if (lastTop === null) {
      lastTop = top;
    }
    if (top !== lastTop) {
      lineGroups.push(currentGroup);
      currentGroup = [];
      lastTop = top;
    }
    currentGroup.push(node);
  }
  if (currentGroup.length > 0) {
    lineGroups.push(currentGroup);
  }
  return lineGroups;
}

export function splitText(target: ElementOrSelector): SplitResult {
  const element: Element | null =
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target)
      : target instanceof Element
        ? target
        : target[0] instanceof Element
          ? target[0]
          : null;

  if (!element) {
    throw new Error(`Element not found for selector: ${target}`);
  }

  const originalText = element.textContent ?? "";
  element.setAttribute("aria-label", originalText);
  element.textContent = "";

  const chars = [] as HTMLSpanElement[];
  const words = [] as HTMLSpanElement[];
  const lines = [] as HTMLSpanElement[];

  const fragment = document.createDocumentFragment();
  const tokens = originalText.split(/(\s+)/);
  for (const token of tokens) {
    if (/\s+/.test(token)) {
      fragment.appendChild(document.createTextNode(token));
      continue;
    }
    if (token.length <= 0) continue;

    const wordSpan = createSpan("word");

    for (const char of token) {
      const charSpan = createSpan("char");
      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
      chars.push(charSpan);
    }

    fragment.appendChild(wordSpan);
    words.push(wordSpan);
  }

  element.appendChild(fragment);

  if (words.length === 0) return { chars, words, lines };

  const lineGroups = getLineGroups(element);

  const wrapper = document.createDocumentFragment();
  for (const group of lineGroups) {
    const lineSpan = createSpan("line");
    for (const node of group) {
      lineSpan.appendChild(node);
    }
    wrapper.appendChild(lineSpan);
    lines.push(lineSpan);
  }

  element.replaceChildren(wrapper);

  return { chars, words, lines };
}
