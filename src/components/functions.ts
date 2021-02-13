import { TranslateResult } from 'vue-i18n';
import { LineDescription, ConversionResult, unStringifiedContent } from './../types';

interface Translator {
  $t(key: string, values?: unknown[]): TranslateResult
}

export const typeOptions = [
  "uuid",
  "timestamp",
  "string",
  "null",
  "mimetype",
  "locale",
  "jwt",
  "email",
  "number",
  "boolean",
];

export function parseOutType(s: string): LineDescription {
  const splitByColon = s.split(":");
  if (splitByColon.length < 2) {
    const noWhiteSpace = s.replace(/ /g, "").replace(/,/g, "");
    if (["{", "}", "[", "]"].includes(noWhiteSpace)) {
      // Line is just for display purposes
      return {
        display: s,
        optional: false,
      };
    }
    else {
      // Type of thing inside array when not object, e.g. "number"
      return {
        display: s,
        type: s.replace(/"/g, "").replace(/ /g, "").replace(/,/g, ""),
        optional: false,
      };
    }
  }
  let fieldName = splitByColon[0] + ": ";
  let optional = false;
  if (splitByColon[0].indexOf("?") === splitByColon[0].length - 2) {
    optional = true;
    fieldName = fieldName.replace('?"', '"');
  }
  let displayAfter = ",";
  const type = splitByColon[1]
    .replace(/"/g, "")
    .replace(/ /g, "")
    .replace(/,/g, "");
  let actualType = "";
  switch (type) {
    case "[":
      actualType = "array";
      displayAfter = "[";
      break;
    case "[]":
      actualType = "array";
      displayAfter = "[],";
      break;
    case "uuid":
      actualType = "uuid";
      break;
    case "timestamp":
      actualType = "timestamp";
      break;
    case "string":
      actualType = "string";
      break;
    case "null":
      actualType = "null";
      break;
    case "mimetype":
      actualType = "mimetype";
      break;
    case "{":
      actualType = "object";
      displayAfter = "{";
      break;
    case "{}":
      actualType = "object";
      displayAfter = "{},";
      break;
    case "locale":
      actualType = "locale";
      break;
    case "jwt":
      actualType = "jwt";
      break;
    case "email":
      actualType = "email";
      break;
    case "number":
      actualType = "number";
      break;
    case "boolean":
      actualType = "boolean";
      break;
    default:
      actualType = type;
      break;
  }
  return {
    display: fieldName,
    type: actualType,
    displayAfter,
    optional,
  };
}

export function validateType(input: string): boolean {
  try {
    const allowedTypes = [...typeOptions, 'array', 'object']
    const operators = ['<', '>', '=']
    const longOperators = ['>=', '<=']
    if (allowedTypes.includes(input)) {
      return true
    }
    const splitByOr = input.split('|')
    for (let i = 0; i < splitByOr.length; i += 1) {
      const current = splitByOr[i]
      if (allowedTypes.includes(current)) {
        continue
      }
      if (!current.includes('string&length')) {
        return false
      }
      if (current.indexOf('string&length') === 0 && current.length > 13) {
        if (longOperators.includes(current.substring(13, 15))) {
          const num = current.substring(15, current.length)
          if (!isNaN(Number(num)) && Number(num) > 0) {
            continue
          }
        }
        else if (operators.includes(current[13])) {
          const num = current.substring(14, current.length)
          if (!isNaN(Number(num)) && Number(num) > 0) {
            continue
          }
        }
      }
      return false
    }
    return true
  }
  catch (e) {
    console.error(e)
    return false
  }
}

export function beautify(
  // eslint-disable-next-line @typescript-eslint/ban-types
  input: object|object[]|string[],
  $t: Translator["$t"],
  JSONDisplayLimit = 4000,
  limit = false
): string {
  const beautiful = JSON.stringify(input, null, 4);
  if (beautiful.length > JSONDisplayLimit && limit) {
    return beautiful.substr(0, JSONDisplayLimit) + `\n\n...${$t('object concatenated for performance reasons')}`
  }
  return beautiful
}

export function removeWhitespaceNotInKey(input: string, optional: boolean): string {
  const firstQuote = input.indexOf('"');
  const secondQuote = input.indexOf('"', firstQuote + 1);
  let savedKey = input.substring(firstQuote + 1, secondQuote);
  if (optional && savedKey.indexOf("?") !== savedKey.length - 1) {
    savedKey = savedKey + "?";
  }
  const noWhiteSpace = input.replace(/ /g, "");
  const firstQuoteInNoWhiteSpace = noWhiteSpace.indexOf('"');
  const secondQuoteInNoWhiteSpace = noWhiteSpace.indexOf(
    '"',
    firstQuoteInNoWhiteSpace + 1
  );
  const modifiedKey = noWhiteSpace.substring(
    firstQuoteInNoWhiteSpace + 1,
    secondQuoteInNoWhiteSpace
  );
  return noWhiteSpace.split(modifiedKey).join(savedKey);
}

export function convertBackToObject(
  input: LineDescription[],
  $t: Translator["$t"],
): ConversionResult {
  let returnItem = "";
  input.forEach((item) => {
    if (item.type) {
      let addString = removeWhitespaceNotInKey(
        item.display,
        item.optional
      );
      addString += `${
        ["object", "array"].includes(item.type) ? `` : `"${item.type}"`
      }${item.displayAfter}`;
      returnItem += addString;
    }
    else {
      returnItem += item.display.replace(/ /g, "");
    }
  });
  let unnecessaryCommasRemoved = "";
  for (let i = 0; i < returnItem.length; i += 1) {
    if (returnItem[i] === "," && returnItem[i + 1] !== '"') {
      continue;
    }
    unnecessaryCommasRemoved += returnItem[i];
  }
  const parsed = JSON.parse(unnecessaryCommasRemoved);
  unnecessaryCommasRemoved = beautify(parsed, $t);
  return {
    asObject: parsed,
    asString: unnecessaryCommasRemoved,
  };
}

export function getLinesForDisplay(
  // eslint-disable-next-line @typescript-eslint/ban-types
  input: object | object[]|string[],
  $t: Translator["$t"],
): LineDescription[] {
  const beautified = beautify(input, $t);
  const split = beautified.split("\n");
  const typesParsed = split.map((i) => {
    return parseOutType(i);
  });
  return typesParsed;
}

export function convertToMarkdown(input: unStringifiedContent): string {
  let mdString = '# Endpoint Definitions\n\n'
  const endPointsWithReqAndResponse = {}
  Object.keys(input).map(async (type: string) => {
    if (type === 'request') {
      Object.keys(input[type]).map(async (method: string) => {
        Object.keys(input[type][method]).map(async (endpoint: string) => {
          if (!endPointsWithReqAndResponse[endpoint]) endPointsWithReqAndResponse[endpoint] = {}
          if (!endPointsWithReqAndResponse[endpoint][method]) {
            endPointsWithReqAndResponse[endpoint][method] = {
              request: {},
              response: {}
            }
          }
          endPointsWithReqAndResponse[endpoint][method].request = input[type][method][endpoint]
        })
      })
    }
    else {
      Object.keys(input[type]).map(async (method: string) => {
        Object.keys(input[type][method]).map(async (endpoint: string) => {
          if (!endPointsWithReqAndResponse[endpoint]) endPointsWithReqAndResponse[endpoint] = {}
          if (!endPointsWithReqAndResponse[endpoint]) {
            endPointsWithReqAndResponse[endpoint][method] = {
              request: {},
              response: {}
            }
          }
          endPointsWithReqAndResponse[endpoint][method].response = input[type][method][endpoint]
        })
      })
    }
  })

  const methodOrder = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE'
  ]
  Object.keys(endPointsWithReqAndResponse).sort((a, b) => a.localeCompare(b)).forEach(endpoint => {
    mdString += `## ${endpoint}\n\n`
    Object.keys(endPointsWithReqAndResponse[endpoint]).sort((a, b) => {
      return methodOrder.findIndex(i => i === a) - methodOrder.findIndex(i => i === b)
    }).forEach(method => {
      mdString += `### ${method}\n\n`
      mdString += '#### Request\n\n'
      mdString += '```json\n'
      mdString += `${endPointsWithReqAndResponse[endpoint][method].request}`
      mdString += '\n'
      mdString += '```'
      mdString += '\n\n'
      mdString += '#### Response\n\n'
      mdString += '```json\n'
      mdString += `${endPointsWithReqAndResponse[endpoint][method].response}`
      mdString += '\n'
      mdString += '```\n\n'
    })
  })
  return mdString
}
