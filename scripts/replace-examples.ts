import * as path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const LANGS = {
    ts: 'typescript',
    js: 'javascript',
};

async function extractExampleCode(file: string, exampleName?: string) {
    const fileContents = readFileSync(file, { encoding: 'utf-8' });

    const startTag = exampleName ? `// EXAMPLE:${exampleName}:START` : '// EXAMPLE:START';
    const endTag = exampleName ? `// EXAMPLE:${exampleName}:END` : '// EXAMPLE:END';

    const start = fileContents.indexOf(startTag);
    const end = fileContents.indexOf(endTag);

    if (start < 0 || end < 0 || end < start) {
        throw new Error(`Did not find code example enclosed by ${startTag} and ${endTag} in ${file}`);
    }

    const exampleContents = fileContents.slice(start + startTag.length, end);
    const lines = exampleContents.split(/\r?\n/).map((l) => (/^\s*$/.test(l) ? '' : l));
    const minIndent = lines
        .filter((l) => l !== '')
        .map((l) => {
            let i = 0;
            while (l[i] === ' ') {
                i++;
            }
            return i;
        })
        .reduce((a, b) => Math.min(a, b), Infinity);
    const startLine = lines.findIndex((l) => l !== '');
    const resultLines = lines.slice(startLine).map((l) => l.slice(minIndent));
    return resultLines.join('\n');
}

function replaceContent(originalContent: string, exampleRef: string, replacement: string): string {
    const startAnchor = `<!-- EXAMPLE:${exampleRef}:START -->`;
    const endAnchor = `<!-- EXAMPLE:${exampleRef}:END -->`;
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

async function replaceExamplesInPackage(pkgName: string, pkgLocation: string) {
    const readmePath = path.join(pkgLocation, 'README.md');
    if (existsSync(readmePath)) {
        const readmeContents = readFileSync(readmePath, { encoding: 'utf-8' });
        let updatedContents = readmeContents;

        const m = readmeContents.match(/<!-- EXAMPLE:(.+?):START -->/g);

        if (m) {
            console.log(readmePath);
            for (const tag of m) {
                const [, exampleRef] = tag.match(/<!-- EXAMPLE:(.+?):START -->/);
                const [file, exampleName] = exampleRef.split(':');
                let found = false;
                for (const lang of Object.keys(LANGS)) {
                    const fileName = path.join(pkgLocation, `examples/${file}.${lang}`);
                    if (existsSync(fileName)) {
                        console.log('-->', exampleRef, fileName, exampleName);
                        const code = await extractExampleCode(fileName, exampleName);
                        updatedContents = replaceContent(
                            updatedContents,
                            exampleRef,
                            '```' + LANGS[lang] + '\n' + code + '\n```'
                        );
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw new Error(
                        `No example ${exampleRef}.{${Object.keys(LANGS).join(',')}} found in examples directory`
                    );
                }
            }
        }

        if (readmeContents !== updatedContents) {
            writeFileSync(readmePath, updatedContents, { encoding: 'utf-8' });
            execSync(`prettier --write ${readmePath}`);
        }
    }
}

async function main() {
    const yarnInfo = JSON.parse(execSync('yarn -s workspaces info').toString('utf-8'));
    for (const pkg of Object.keys(yarnInfo)) {
        await replaceExamplesInPackage(pkg, yarnInfo[pkg].location);
    }
}

main().then(
    () => process.exit(0),
    (e) => {
        console.error(e);
        process.exit(1);
    }
);
