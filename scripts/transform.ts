import "zx/globals";
import { cloneDeep, trim, uniqBy, groupBy, sortBy } from "lodash";

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
    if (line.includes(`:-|:-:`)) {
      chunk.start = index + 1;
      return;
    }
  });

  const newLines = cloneDeep(lines);

  const partSortByName = (part: string[]) => {
    part.sort((a, b) => {
      const aName = a.split('|')[0]
      const bName = b.split('|')[0]
      return aName.localeCompare(bName)
    });
    return part;
  };
  const removeDuplicate = (part: string[]) => {
    return uniqBy(part, (line) => {
      return trim(line.split('|')[0])
    })
  }
  const sortPart = (part: string[]) => {
    const priorityGroup = groupBy(part, (line) => {
      return line.split('|')[1]
    })
    const keys = sortBy(Object.keys(priorityGroup)).reverse()
    console.log('keys: ', keys);
    keys.forEach(key => {
      priorityGroup[key] = partSortByName(priorityGroup[key])
    })
    return keys.reduce<string[]>((memo, current) => {
      return [
        ...memo,
        ...priorityGroup[current]
      ]
    }, [])
  }
  chunks.forEach(({ start, end }) => {
    const part = removeDuplicate(
      newLines.slice(start, end).map((l) => trim(l))
    )
    const sortedPart = sortPart(part)
    newLines.splice(start, end - start, ...sortedPart);
  });

  const counts = chunks.reduce((total, current) => {
    total += current.end - current.start;
    return total;
  }, 0);

  console.log(`Total: ${chalk.green(counts)}`);

  const newContent = `${newLines.join("\n")}\n`;
  const outputPath = path.join(__dirname, "../README.md");
  fs.writeFileSync(outputPath, newContent, "utf-8");
};

run();
