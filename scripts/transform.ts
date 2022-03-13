import "zx/globals";
import { cloneDeep, trim } from "lodash";

interface IChunk {
  start: number;
  end: number;
}

const EMPTY_CHUNK: IChunk = { start: 0, end: 0 };

const run = async () => {
  const tplPath = path.join(__dirname, "../README.tpl.md");

  const content = `${fs.readFileSync(tplPath, "utf-8")}\n`;

  const lines = content.split("\n");
  const chunks: IChunk[] = [];

  let chunk: IChunk = cloneDeep(EMPTY_CHUNK);
  lines.forEach((line, index) => {
    // find end
    if (chunk.start > 0 && !trim(line)?.length) {
      chunk.end = index;
      // save
      chunks.push(chunk);
      // reset chunk
      chunk = cloneDeep(EMPTY_CHUNK);
      return;
    }
    // find start
    if (line.includes(`:-:|:-:`)) {
      chunk.start = index + 1;
      return;
    }
  });

  const newLines = cloneDeep(lines);

  const partTransform = (part: string[]) => {
    // only replace once
    part = part.map((l) => l.replace("前端", "**前端**"));
    part.sort((a, b) => a.localeCompare(b));
    return part;
  };
  chunks.forEach(({ start, end }) => {
    const part = newLines.slice(start, end).map((l) => trim(l));
    const sortedPart = [
      ...partTransform(part.filter((l) => l.includes("✓"))),
      ...partTransform(part.filter((l) => !l.includes("✓"))),
    ];
    newLines.splice(start, end - start, ...sortedPart);
  });

  const counts = chunks.reduce((total, current) => {
    total += current.end - current.start
    return total
  }, 0)

  console.log(`Total: ${chalk.green(counts)}`)

  const newContent = `${newLines.join("\n")}\n`;
  const outputPath = path.join(__dirname, "../README.md");
  fs.writeFileSync(outputPath, newContent, "utf-8");
};

run();
