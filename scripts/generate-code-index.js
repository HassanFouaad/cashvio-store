const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'MAP.md');
const ROOT_LABEL = 'store-front';

const IGNORED_NAMES = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.git',
  '.cursor',
  '.agents',
  '.vscode',
  '.turbo',
  '.next',
  'terminals',
]);

function shouldIgnore(name) {
  if (name.startsWith('.')) return true;
  if (IGNORED_NAMES.has(name)) return true;
  return false;
}

function scanDirectory(dirPath, depth = 0) {
  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !shouldIgnore(entry.name))
    .sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' })
    );

  const lines = [];

  for (const entry of entries) {
    const isDirectory = entry.isDirectory();
    const prefix = depth === 0 ? '' : '│' + ' '.repeat(depth * 2);

    if (isDirectory) {
      lines.push({
        isDir: true,
        text: `${prefix}└── 📂 ${entry.name}/`,
      });
      const subEntries = scanDirectory(
        path.join(dirPath, entry.name),
        depth + 1
      );
      lines.push(...subEntries);
    } else {
      lines.push({
        isDir: false,
        prefix,
        name: entry.name,
      });
    }
  }

  return lines;
}

function generateCodeIndex() {
  const rawEntries = scanDirectory(ROOT_DIR);
  const formattedLines = ['', `. 📂 ${ROOT_LABEL}`];

  for (let i = 0; i < rawEntries.length; i++) {
    const item = rawEntries[i];
    if (item.isDir) {
      formattedLines.push(item.text);
    } else {
      const isLastItem = i === rawEntries.length - 1;
      const branch = isLastItem ? '└── 📄 ' : '├── 📄 ';
      formattedLines.push(`${item.prefix}${branch}${item.name}`);
    }
  }

  return formattedLines.join('\r\n') + '\r\n';
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function main() {
  const checkMode = process.argv.includes('--check');
  const generated = generateCodeIndex();

  if (checkMode) {
    if (!fs.existsSync(OUTPUT_FILE)) {
      console.error('MAP.md does not exist.');
      process.exit(1);
    }
    const current = fs.readFileSync(OUTPUT_FILE, 'utf8');
    if (normalize(current) !== normalize(generated)) {
      console.error('MAP.md is out of date. Run "yarn index:code" to update it.');
      process.exit(1);
    }
    console.log('MAP.md is up to date.');
  } else {
    fs.writeFileSync(OUTPUT_FILE, generated, 'utf8');
    console.log('MAP.md updated successfully.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateCodeIndex, scanDirectory, shouldIgnore, normalize };
