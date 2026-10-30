// The renderer intentionally supports only single-line scalar titles and flow lists.
export const displayCategory = (category: string) => category === 'Javascript' ? 'JavaScript' : category

export const validatePostPath = (file: string) => {
  if (!file.endsWith('.md') || file.slice(0, -3).split('/').some(segment =>
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment) || segment === 'index' || /^\d+\./.test(segment))) {
    throw new Error(`${file}: each path segment must match ^[a-z0-9]+(?:-[a-z0-9]+)*$, with no numeric ordering prefix or index segment`)
  }
}

export const parsePostFrontmatter = (source: string, file = 'article') => {
  const fail = (): never => { throw new Error(`${file}: use a single-line scalar title and a non-empty inline categories list; block lists, multiline scalars, anchors and tags are unsupported`) }
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
  if (!frontmatter) { return fail() }
  const lines = frontmatter.split(/\r?\n/)
  const field = (name: string) => {
    const matches = lines.filter(line => line.startsWith(`${name}:`))
    if (matches.length !== 1) { return fail() }
    const index = lines.indexOf(matches[0]!)
    // A following indented line would continue the scalar or introduce a block list.
    if (lines[index + 1] && /^\s+\S/.test(lines[index + 1]!)) { return fail() }
    return matches[0]!.slice(name.length + 1).trim()
  }
  const scalar = (text: string, start: number, flow = false): [string, number] => {
    let i = start
    const quote = text[i]
    if (quote === "'" || quote === '"') {
      i++
      let value = ''
      while (i < text.length) {
        const char = text[i++]!
        if (char === quote) {
          if (quote === "'" && text[i] === "'") {
            value += "'"
            i++
            continue
          }
          return [value, i]
        }
        if (quote === '"' && char === '\\') {
          const escape = text[i++]!
          const escapes: Record<string, string> = { 0: '\0', a: '\x07', b: '\b', t: '\t', n: '\n', v: '\v', f: '\f', r: '\r', e: '\x1b', ' ': ' ', '"': '"', '/': '/', '\\': '\\', N: '\u0085', _: '\u00a0', L: '\u2028', P: '\u2029' }
          if (escape === 'u' || escape === 'x' || escape === 'U') {
            const lengths: Record<string, number> = { x: 2, u: 4, U: 8 }
            const length = lengths[escape]!
            const hex = text.slice(i, i + length)
            if (!new RegExp(`^[0-9a-fA-F]{${String(length)}}$`).test(hex) || parseInt(hex, 16) > 0x10FFFF) { return fail() }
            value += String.fromCodePoint(parseInt(hex, 16)); i += length
          }
          else if (Object.hasOwn(escapes, escape)) { value += escapes[escape]! }
          else { return fail() }
        }
        else { value += char }
      }
      return fail()
    }
    while (i < text.length && (!flow || (text[i] !== ',' && text[i] !== ']'))) { i++ }
    const value = text.slice(start, i).trim()
    if (!value || /^[!&*|>[\]{}?#,@`%]/.test(value) || /:\s|\s#|[[\]{}]/.test(value)) { return fail() }
    return [value, i]
  }
  const titleText = field('title')
  const [title, end] = scalar(titleText, 0)
  if (!title || titleText.slice(end).trim()) { return fail() }
  const list = field('categories')
  if (!list.startsWith('[')) { return fail() }
  const categories: string[] = []
  let i = 1
  while (i < list.length) {
    while (/\s/.test(list[i] ?? '') && i < list.length) { i++ }
    if (list[i] === ']') {
      i++
      break
    }
    const [value, next] = scalar(list, i, true)
    if (!value) { return fail() }
    categories.push(value)
    i = next
    while (/\s/.test(list[i] ?? '') && i < list.length) { i++ }
    if (list[i] === ']') {
      i++
      break
    }
    if (list[i++] !== ',') { return fail() }
  }
  if (!categories.length || list[i - 1] !== ']' || list.slice(i).trim()) { return fail() }
  return { title, categories }
}
