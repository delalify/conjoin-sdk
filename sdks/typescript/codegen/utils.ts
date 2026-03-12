export function toPascalCase(str: string): string {
  return str
    .split(/[\s\-_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export function lcfirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

const UNCOUNTABLE = new Set([
  'adulthood',
  'advice',
  'agenda',
  'aid',
  'aircraft',
  'alcohol',
  'ammo',
  'analytics',
  'anime',
  'athletics',
  'audio',
  'bison',
  'blood',
  'bream',
  'buffalo',
  'butter',
  'carp',
  'cash',
  'chassis',
  'chess',
  'clothing',
  'cod',
  'commerce',
  'cooperation',
  'corps',
  'debris',
  'diabetes',
  'digestion',
  'elk',
  'energy',
  'equipment',
  'excretion',
  'expertise',
  'firmware',
  'flounder',
  'fun',
  'gallows',
  'garbage',
  'graffiti',
  'hardware',
  'headquarters',
  'health',
  'herpes',
  'highjinks',
  'homework',
  'housework',
  'information',
  'jeans',
  'justice',
  'kudos',
  'labour',
  'literature',
  'machinery',
  'mackerel',
  'mail',
  'media',
  'mews',
  'moose',
  'music',
  'mud',
  'manga',
  'news',
  'only',
  'personnel',
  'pike',
  'plankton',
  'pliers',
  'police',
  'pollution',
  'premises',
  'rain',
  'research',
  'rice',
  'salmon',
  'scissors',
  'series',
  'sewage',
  'shambles',
  'shrimp',
  'software',
  'staff',
  'swine',
  'tennis',
  'traffic',
  'transportation',
  'trout',
  'tuna',
  'wealth',
  'welfare',
  'whiting',
  'wildebeest',
  'wildlife',
  'you',
])

const UNCOUNTABLE_RULES: RegExp[] = [/[^aeiou]ese$/i, /deer$/i, /fish$/i, /measles$/i, /o[iu]s$/i, /pox$/i, /sheep$/i]

const IRREGULARS = new Map<string, string>([
  ['child', 'children'],
  ['die', 'dice'],
  ['echo', 'echoes'],
  ['foot', 'feet'],
  ['genus', 'genera'],
  ['goose', 'geese'],
  ['human', 'humans'],
  ['man', 'men'],
  ['ox', 'oxen'],
  ['person', 'people'],
  ['quiz', 'quizzes'],
  ['tooth', 'teeth'],
  ['woman', 'women'],
])

const PLURAL_RULES: [RegExp, string][] = [
  [/m[ae]n$/i, 'men'],
  [/eaux$/i, '$0'],
  [/(child)(?:ren)?$/i, '$1ren'],
  [/(pe)(?:rson|ople)$/i, '$1ople'],
  [/\b((?:tit)?m|l)(?:ice|ouse)$/i, '$1ice'],
  [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, '$1ices'],
  [/(x|ch|ss|sh|zz)$/i, '$1es'],
  [/([^ch][ieo][ln])ey$/i, '$1ies'],
  [/([^aeiouy]|qu)y$/i, '$1ies'],
  [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, '$1$2ves'],
  [/sis$/i, 'ses'],
  [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i, '$1a'],
  [
    /(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i,
    '$1a',
  ],
  [/(her|at|gr)o$/i, '$1oes'],
  [/(seraph|cherub)(?:im)?$/i, '$1im'],
  [/(alumn|alg|vertebr)(?:a|ae)$/i, '$1ae'],
  [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1i'],
  [/([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$/i, '$1'],
  [/(e[mn]u)s?$/i, '$1s'],
  [/(alias|[^aou]us|t[lm]as|gas|ris)$/i, '$1es'],
  [/(ax|test)is$/i, '$1es'],
  [/([^aeiou]ese)$/i, '$1'],
  [/s?$/i, 's'],
]

export function pluralize(word: string): string {
  const lower = word.toLowerCase()

  if (UNCOUNTABLE.has(lower)) return word
  for (const rule of UNCOUNTABLE_RULES) {
    if (rule.test(word)) return word
  }

  const irregular = IRREGULARS.get(lower)
  if (irregular) {
    return word.charAt(0) + irregular.slice(1)
  }

  for (const [rule, replacement] of PLURAL_RULES) {
    if (rule.test(word)) {
      return word.replace(rule, replacement)
    }
  }

  return `${word}s`
}

export function parseTag(tag: string): { service: string; resource: string } {
  const [service, ...resourceParts] = tag.split(' - ')
  return {
    service: service.trim().toLowerCase(),
    resource: resourceParts.join(' - ').trim(),
  }
}

export function operationIdToMethodName(operationId: string, servicePascal: string, resourcePascal: string): string {
  const serviceResource = servicePascal + resourcePascal
  const candidates = [
    pluralize(serviceResource),
    serviceResource,
    pluralize(resourcePascal),
    resourcePascal,
    servicePascal,
  ]

  for (const token of candidates) {
    const idx = operationId.indexOf(token)
    if (idx >= 0) {
      const result = operationId.slice(0, idx) + operationId.slice(idx + token.length)
      if (result.length > 0) return lcfirst(result)
    }
  }

  return operationId
}

export type PathParam = {
  name: string
  camelName: string
}

export function extractPathParams(pathTemplate: string): PathParam[] {
  const matches = pathTemplate.matchAll(/\{(\w+)\}/g)
  const params: PathParam[] = []
  for (const match of matches) {
    const name = match[1]
    params.push({ name, camelName: toCamelCase(name) })
  }
  return params
}

export function stripV1Prefix(path: string): string {
  return path.replace(/^\/v1\//, '')
}

export function buildRuntimePath(pathTemplate: string, pathParams: PathParam[]): string {
  let path = stripV1Prefix(pathTemplate)
  path = path.replace(/\{\{(\w+)\}\}/g, (_, name) => `\${${toCamelCase(name)}}`)
  for (const param of pathParams) {
    path = path.replace(`{${param.name}}`, `\${${param.camelName}}`)
  }
  return path
}
