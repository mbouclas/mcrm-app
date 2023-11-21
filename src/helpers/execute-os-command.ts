import { SharedModule } from "~shared/shared.module";
const { spawn } = require('node:child_process');
const crossSpawn = require('cross-spawn');
const fs = require('node:fs');
const out = fs.openSync('./logs/command-executor.log', 'a');
const err = fs.openSync('./logs/command-executor-error.log', 'a');
export async function executeOsCommand(commandStr: string, binPath: string, verbose = false) {
  const parts = commandStr.split(" ");
  const args = parts.slice(1);
  const command = parts[0];

  const subprocess = spawn(command, args, {
    detached: true,
    stdio: [ 'inherit', out, err ],
    cwd: binPath,
  });

  subprocess.on('error', (err) => {
    SharedModule.logger.error(err);
  });

  subprocess.on('close', (code) => {
    if (verbose) {
      console.log('Process Closed', code)
    }
  });

  subprocess.on('data', (data) => {
    if (verbose) {
      console.log(data.toString());
    }
  });

  subprocess.unref();

  return true;
}

export async function executeOsCommandPromise(commandStr: string, binPath: string, verbose = false) {
  const parts = commandStr.split(" ");
  const options = parts.slice(1);
  const command = parts[0];

  process.chdir(binPath);
  const exec = crossSpawn(command, options);

  return new Promise((resolve, reject) => {
    exec.stdout.on("data", data => {

      if (verbose) {
        console.log(data.toString());
      }
    });

    exec.stderr.on("data", data => {
      if (verbose) {
        console.log(data.toString());
      }

      SharedModule.logger.error(data.toString());
      reject(data.toString());
    });

    exec.on("close", code => {
      //emit on end event
      if (code !== 0) {
        reject(code);
      }


      SharedModule.logger.log(`Execution Complete`);
      resolve(code);
    });
  });
}
