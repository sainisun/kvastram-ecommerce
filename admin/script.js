const fs = require('fs');
const file = 'e:\\\\Kvastram projects\\\\kvastram-platform\\\\admin\\\\src\\\\app\\\\dashboard\\\\marketing\\\\page.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replaceAll('React.FormEvent', 'React.FormEvent<HTMLFormElement>');
code = code.replaceAll('parseInt(', 'Number.parseInt(');
code = code.replace(/const quickLinks = \[[\s\S]*?\];/s, '');

// remove commented blocks with TODOs
code = code.replace(/\{\/\*\s*TODO: Enable when email[\s\S]*?\*\/\}/gs, '');
code = code.replace(/\{\/\*\s*TODO: Enable when marketing analytics[\s\S]*?\*\/\}/gs, '');
code = code.replace(/\/\/\s*TODO: Enable when email marketing[^\n]*/g, '');
code = code.replace(/\/\/\s*TODO: Enable when marketing analytics[^\n]*/g, '');

let c = 0;
// We replace the label followed by an input/select/textarea
code = code.replace(/<label(\s+className=[^>]+)>([\s\S]*?)<\/label>(\s*)<(input|select|textarea)/g, (m, cls, txt, space, tag) => {
    c++;
    return `<label htmlFor="field-${c}"${cls}>${txt}</label>${space}<${tag} id="field-${c}"`;
});

fs.writeFileSync(file, code);
console.log('Fixed labels: ' + c);
