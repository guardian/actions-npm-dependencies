const command = new Deno.Command("git", {
  args: [
    "describe",
    "--tags",
    "--abbrev=0",
  ],
});
const { code, stdout } = await command.output();

// https://tldp.org/LDP/abs/html/exitcodes.html
console.assert(code === 0);

const tag = new TextDecoder().decode(stdout).trim();

console.log(`Found tag ${tag}`);

export { tag };
