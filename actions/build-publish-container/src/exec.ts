import { exec } from '@actions/exec';

export const sh = (...cmd: string[]) => {
    // console.log(`$ ${cmd.join(' ')}`);
    return exec(cmd[0], cmd.slice(1));
};
