type WordsSource = { [key: string]: WordsSource | null };
type StackEntry = { letter: string; node: WordsSource | null; level: number };

function printWords(source: WordsSource): string[] {
  const words: string[] = [];
  const letters: string[] = [];
  const visited = new WeakSet<WordsSource>();
  const stack: StackEntry[] = [{ letter: "", node: source, level: 0 }];
  while (stack.length) {
    const { letter, node, level } = stack.pop()!;
    if (level == letters.length) {
      letters.push(letter);
    } else {
      letters.splice(level);
      letters.push(letter);
    }
    if (!node) {
      words.push(letters.join(""));
    } else {
      if (!visited.has(node)) {
        visited.add(node);
        const keys = Object.keys(node).sort().reverse(); // можно заменить на сортировку в обратном порядке
        // можно заменить sort+reverse O(NlogN) перебором алфавита O(N)
        for (const key of keys) {
          // можно заменить reverse циклом for (let i = keys.length - 1; i >=0; --i)
          stack.push({ letter: key, node: node[key], level: level + 1 });
        }
      }
    }
  }
  return words;
}

describe("print", () => {
  test("empty", () => {
    const source = {};
    expect(printWords(source)).toStrictEqual([]);
  });
  test("one letter", () => {
    const source = { x: null };
    expect(printWords(source)).toStrictEqual(["x"]);
  });
  test("one word", () => {
    const source = { f: { o: { e: null } } };
    expect(printWords(source)).toStrictEqual(["foe"]);
  });
  test("many", () => {
    const source = {
      b: { a: null, d: null, c: null },
      a: {
        c: { t: null },
        p: {
          p: {
            e: { n: { d: null } },
            l: { e: null },
          },
        },
      },
    };
    expect(printWords(source)).toStrictEqual(["act", "append", "apple", "ba", "bc", "bd"]);
  });
});
