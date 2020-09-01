import * as path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

function generateVersionBadge(packageName: string): string {
    const encodedPkg = encodeURIComponent(packageName);
    return `[![npm version](https://badge.fury.io/js/${encodedPkg}.svg)](https://npm.im/${encodedPkg})`;
}

function replaceContent(originalContent: string, anchorName: string, replacement: string): string {
    const startAnchor = `<!-- ${anchorName} -->`;
    const endAnchor = `<!-- ${anchorName}-END -->`;
    const start = originalContent.indexOf(startAnchor);
    const end = originalContent.indexOf(endAnchor);
    if (start < 0) {
        throw new Error(`Did not find anchor ${startAnchor} for replacing content in markdown file`);
    }
    if (end < 0) {
        throw new Error(`Did not find end anchor ${endAnchor} for replacing content in markdown file`);
    }
    return [originalContent.slice(0, start), startAnchor, '\n', replacement, '\n', originalContent.slice(end)].join(
        '\n'
    );
}

function extractDescription(pkgPath: string): string | undefined {
    const pkgReadmePath = path.join(__dirname, '..', pkgPath, 'README.md');
    if (existsSync(pkgReadmePath)) {
        const contents = readFileSync(pkgReadmePath, { encoding: 'utf-8' });
        const lines = contents.split(/[\r\n]/);
        const firstParagraph = lines.find((line) => line !== '' && !line.startsWith('#') && !line.startsWith('!'));
        return firstParagraph;
    }
    return undefined;
}

async function main() {
    console.log('Generating package list in README');
    const readmePath = path.join(__dirname, '../README.md');
    const originalContents = readFileSync(readmePath, { encoding: 'utf-8' });
    const yarnInfo = JSON.parse(execSync('yarn -s workspaces info').toString('utf-8'));
    const markdownContents = Object.keys(yarnInfo).map((pkg) => {
        const path: string = yarnInfo[pkg].location;
        return `### [\`${pkg}\`](./${path}) ${generateVersionBadge(pkg)}\n\n${extractDescription(path)}`;
    });
    const updatedContents = replaceContent(originalContents, 'PACKAGE-LIST', markdownContents.join('\n\n'));
    writeFileSync(readmePath, updatedContents, { encoding: 'utf-8' });
    execSync(`prettier --write ${readmePath}`);
}

main().then(
    () => process.exit(0),
    (e) => {
        console.error(e);
        process.exit(1);
    }
);
