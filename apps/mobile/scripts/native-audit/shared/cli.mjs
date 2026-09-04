export function parseArgs(argv) {
    return {
        flag: name => argv.includes(name),
        option: name => {
            const index = argv.indexOf(name);
            return index !== -1 ? argv[index + 1] : undefined;
        },
        // Bare arguments, with the values of `valued` options skipped so that
        // `fetch <id> --out build.json` does not read `build.json` as an id.
        positionals: (valued = []) => {
            const bare = [];
            for (let index = 0; index < argv.length; index++) {
                if (valued.includes(argv[index])) index += 1;
                else if (!argv[index].startsWith('--')) bare.push(argv[index]);
            }
            return bare;
        }
    };
}
