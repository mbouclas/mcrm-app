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
