export function parseArgs(argv) {
    return {
        flag: name => argv.includes(name),
        option: name => {
            const index = argv.indexOf(name);
            return index !== -1 ? argv[index + 1] : undefined;
        }
    };
}
