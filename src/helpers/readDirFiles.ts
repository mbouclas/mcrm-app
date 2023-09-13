import * as util from "util";
const path = require('path');
const fs = require('fs');
const readDir = util.promisify(fs.readdir);

export interface IReadDirectoryFilesResult {
    fileName: string;
    fullFileName: string;
    path: string;
    ext: string;
}

export async function readDirFiles(directory: string, ext?: string|string[]): Promise<IReadDirectoryFilesResult[]> {
    let files;
    try {
       files = await readDir(directory);
    }
    catch (e) {

    }

    if (!files) {return [];}

    return files.filter((file: string) => {
        if (ext) {
            return checkExtension(file,ext);

        }

        return file;
    }).map((file: string) => {
        return {
            fileName: file,
            fullFileName: path.join(directory, file),
            path: directory,
            ext: path.extname(file),
        }
    });
}

function checkExtension(file: string, ext: string|string[]) {
    const fileExt = path.extname(file);
    if (typeof ext === 'string') {
        return ext === fileExt;
    }

    let isValid = false;
    ext.forEach(e => {
        if (e === fileExt) {isValid = true;}
    });

    return isValid;
}

interface IFileFolder {
    path: string;
    type: 'file' | 'directory';
}

function shouldBeExcluded(filePath: string, excludedFileTypes: string[]) {
    return excludedFileTypes.some((type) => filePath.endsWith("." + type));
}

export function readFilesRecursively(rootPath: string, excludedFileTypes: string[]): IFileFolder[] {
    let result: IFileFolder[] = [];

    if (!fs.existsSync(rootPath)) {
        return result;
    }

    fs.readdirSync(rootPath).forEach(item => {
        const itemPath = path.join(rootPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            result.push({ path: itemPath, type: 'directory' });
            result = result.concat(readFilesRecursively(itemPath, excludedFileTypes));
        } else if (stat.isFile() && !shouldBeExcluded(itemPath, excludedFileTypes)) {
            result.push({ path: itemPath, type: 'file' });
        }
    });

    return result;
}
